import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InitializeVantDonationDto } from './dto/initialize-vant-donation.dto';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { VantInboundService, VantVerificationResult } from '../inbound-providers/vant.provider';
import { render } from '@react-email/components';
import { EmailService } from 'src/services/email-transport/email-transport.service';
import PaymentSuccessEmail from 'src/domain/email-templates/payment-success';
import PaymentFailureEmail from 'src/domain/email-templates/payment-failure';
import * as crypto from 'crypto';
import { UserService } from 'src/services/user/user.service';

@Injectable()
export class VantService {
    private readonly logger = new Logger(VantService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly vantProvider: VantInboundService,
        private readonly EmailService: EmailService,
        private readonly userService: UserService,
    ) { }

    async initializeDonation(dto: InitializeVantDonationDto) {
        const donorEmail = dto.donorEmail.trim().toLowerCase();
        const confirmedDonorEmail = dto.confirmDonorEmail.trim().toLowerCase();

        if (donorEmail !== confirmedDonorEmail) {
            throw new BadRequestException('Email confirmation does not match');
        }

        const donor = await this.userService.findOrCreateDonationUserByEmail(donorEmail);

        const campaign = await this.prisma.campaign.findUnique({
            where: { id: dto.campaignId },
            select: {
                id: true,
                title: true,
                target_amount: true,
                amount_raised: true,
                currency: true,
                status: true,
                deadline: true,
                is_deleted: true,
            },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (campaign.is_deleted || campaign.status !== 'APPROVED') {
            throw new BadRequestException('Only approved live campaigns can receive donations');
        }

        if (campaign.deadline && campaign.deadline.getTime() < Date.now()) {
            throw new BadRequestException('This campaign has expired and can no longer receive donations');
        }

        // VANT is a Naira bank-transfer product only.
        const currency = 'NGN';
        const isAnonymous = dto.anonymous ?? false;
        const donationAmount = dto.amount;
        const tipAmount = dto.tipAmount ?? 0;
        const platformFee = Math.round(donationAmount * 0.025) + 200;
        const netDonationAmount = donationAmount - platformFee;

        if (netDonationAmount < 1) {
            throw new BadRequestException('Donation amount must be higher than the processing fee');
        }

        const totalCharged = donationAmount + tipAmount;
        const reference = this.generateReference();
        const metadata = {
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            donorEmail: donor.email,
            donorId: donor.id,
            anonymous: isAnonymous,
            platform: 'TorchLife',
            donationAmount,
            netDonationAmount,
            platformFee,
            tipAmount,
            totalCharged,
        };

        const checkout = await this.vantProvider.initializePayment({
            email: donor.email,
            amount: totalCharged,
            tx_ref: reference,
            currency,
            metadata,
        });

        const { donation, payment } = await this.prisma.$transaction(async (tx) => {
            const donation = await tx.donation.create({
                data: {
                    amount: donationAmount,
                    status: 'PENDING',
                    donor_email: isAnonymous ? null : donor.email,
                    is_anonymous: isAnonymous,
                    user_id: donor.id,
                    campaign_id: campaign.id,
                },
            });

            const payment = await tx.payment.create({
                data: {
                    amount: totalCharged,
                    status: 'PENDING',
                    tx_ref: checkout.reference,
                    custom_tx_ref: donation.id,
                    type: 'DEPOSIT',
                    currency,
                    provider: 'vant',
                    donation_id: donation.id,
                    user_id: donor.id,
                    donor_email: donor.email,
                    meta: {
                        metadata,
                        initialization: {
                            accountNumber: checkout.accountNumber,
                            accountName: checkout.accountName,
                            bank: checkout.bank,
                            validTill: checkout.validTill,
                        },
                    },
                },
            });

            return { donation, payment };
        });

        return {
            data: {
                donationId: donation.id,
                paymentId: payment.id,
                reference: checkout.reference,
                accountNumber: checkout.accountNumber,
                accountName: checkout.accountName,
                bank: checkout.bank,
                validTill: checkout.validTill,
                amount: donationAmount,
                platformFee,
                tipAmount,
                totalCharged,
                currency,
                metadata,
                anonymous: isAnonymous,
                donorEmail: donor.email,
            },
        };
    }

  
/**
     * There is no VANT endpoint to look up a transaction by reference, so this
     * just reports the current status from our own database. The frontend
     * should call this to poll while waiting for the webhook to land.
     */
    async verifyTransaction(reference: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { tx_ref: reference },
            include: { donation: { include: { campaign: true } } },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return {
            data: {
                reference: payment.tx_ref,
                success: payment.status === 'SUCCESS',
                paymentStatus: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                campaignId: payment.donation?.campaign?.id ?? null,
                campaignTitle: payment.donation?.campaign?.title ?? null,
                message:
                    payment.status === 'PENDING'
                        ? 'Still waiting for the bank transfer to be confirmed. Keep polling or wait for the webhook.'
                        : undefined,
            },
        };
    }

    /**
     * Handles the VANT inward-transfer webhook payload. VANT does not sign its
     * webhooks and has no endpoint to independently re-verify a transaction, so
     * this webhook IS the source of truth for checkout payments. As a defense
     * in depth measure (on top of the shared secret in the webhook URL), we
     * cross-check the account number in the payload against the account number
     * we generated for this specific payment, plus the amount, before crediting.
     */
    async processWebhookEvent(event: Record<string, any>) {
        const reference = event?.reference;
        if (!reference) {
            this.logger.warn('Received VANT webhook without a transaction reference');
            return { received: true, ignored: true, reason: 'missing_reference' };
        }

        const payment = await this.prisma.payment.findUnique({
            where: { tx_ref: reference },
        });

        if (!payment) {
            this.logger.warn(`Received VANT webhook for unknown reference ${reference}`);
            return { received: true, ignored: true, reason: 'payment_not_found' };
        }

        if (event?.event !== 'transfer') {
            await this.recordWebhookEvent(event, payment.id, reference);
            return { received: true, ignored: true, reason: 'unsupported_event' };
        }

        const expectedAccountNumber = this.getPaymentMetaString(payment.meta, 'accountNumber');
        const accountNumberMatches = !expectedAccountNumber || expectedAccountNumber === event.account_number;

        const verification: VantVerificationResult = {
            success: event.status === 'successful' && accountNumberMatches,
            amount: Number(event.amount),
            currency: 'NGN',
            provider: 'vant',
            channel: 'bank_transfer',
            gatewayResponse: accountNumberMatches ? event.status : 'account_number_mismatch',
            reference: event.reference,
            paidAt: event.timestamp ?? null,
            transactionId: event.sessionId ?? null,
            metadata: {},
            raw: event,
        };

        if (!accountNumberMatches) {
            this.logger.warn(
                `VANT webhook account_number mismatch for reference ${reference}: expected ${expectedAccountNumber}, got ${event.account_number}`,
            );
        }

        return this.reconcilePayment(reference, verification, event);
    }

    private async reconcilePayment(
        reference: string,
        verification: VantVerificationResult,
        event?: Record<string, any>,
    ) {
        const payment = await this.prisma.payment.findUnique({
            where: { tx_ref: reference },
            include: {
                donation: { include: { campaign: true } },
                user: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        const amountMatches = verification.amount === payment.amount;
        const verificationSucceeded = verification.success && amountMatches;
        const failureReason = !verification.success
            ? verification.gatewayResponse ?? 'Payment was not successful on VANT'
            : !amountMatches
                ? 'Verified amount does not match the expected donation amount'
                : null;

        const vantEventId = this.buildWebhookEventId(event, reference, verification.transactionId);

        const result = await this.prisma.$transaction(async (tx) => {
            if (vantEventId) {
                const existingWebhook = await tx.webhook.findUnique({
                    where: { paystack_event_id: vantEventId },
                });

                if (existingWebhook) {
                    return {
                        payment,
                        campaign: payment.donation?.campaign ?? null,
                        alreadyProcessed: true,
                        success: payment.status === 'SUCCESS',
                    };
                }
            }

            const currentPayment = await tx.payment.findUnique({
                where: { id: payment.id },
                include: {
                    donation: { include: { campaign: true } },
                    user: true,
                },
            });

            if (!currentPayment) {
                throw new NotFoundException('Payment not found');
            }

            const wasAlreadySuccessful = currentPayment.status === 'SUCCESS';
            const nextPaymentStatus = verificationSucceeded ? 'SUCCESS' : 'FAILED';

            const updatedPayment = await tx.payment.update({
                where: { id: currentPayment.id },
                data: {
                    status: nextPaymentStatus,
                    synced_at: new Date(),
                    verified_at: new Date(),
                    donor_email:
                        currentPayment.donor_email ??
                        (currentPayment.donation?.is_anonymous ? null : currentPayment.user?.email ?? null),
                    payment_channel: verification.channel ?? currentPayment.payment_channel,
                    comment: failureReason ?? verification.gatewayResponse ?? currentPayment.comment,
                    meta: {
                        ...(typeof currentPayment.meta === 'object' && currentPayment.meta ? currentPayment.meta : {}),
                        vant: verification.raw,
                    },
                },
            });

            let updatedDonation = currentPayment.donation;
            let updatedCampaign = currentPayment.donation?.campaign ?? null;
            let campaignDonorCount = 0;
            let emergenciesSupported = currentPayment.user?.emergencies_supported ?? 0;
            let impactScore = currentPayment.user?.impact_score ?? 0;

            if (currentPayment.donation_id) {
                updatedDonation = await tx.donation.update({
                    where: { id: currentPayment.donation_id },
                    data: {
                        status: nextPaymentStatus,
                        donor_email: currentPayment.donation?.is_anonymous
                            ? null
                            : currentPayment.donor_email ?? currentPayment.user?.email ?? null,
                    },
                    include: { campaign: true },
                });

                updatedCampaign = updatedDonation.campaign;

                if (verificationSucceeded && !wasAlreadySuccessful) {
                    const netDonationAmount =
                        this.getPaymentMetaNumber(updatedPayment.meta, 'netDonationAmount') ?? updatedDonation.amount;

                    updatedCampaign = await tx.campaign.update({
                        where: { id: updatedDonation.campaign_id },
                        data: { amount_raised: { increment: netDonationAmount } },
                    });

                    if (currentPayment.user_id) {
                        const successfulDonations = await tx.donation.count({
                            where: { user_id: currentPayment.user_id, status: 'SUCCESS' },
                        });
                        const uniqueCampaignsSupported = await tx.donation.findMany({
                            where: { user_id: currentPayment.user_id, status: 'SUCCESS' },
                            select: { campaign_id: true },
                            distinct: ['campaign_id'],
                        });

                        const firstDonationBonus = successfulDonations === 1 ? 10 : 0;
                        const repeatDonorBonus = successfulDonations > 1 ? 2 : 0;
                        const amountBonus = Math.floor(updatedDonation.amount / 10000);
                        const completionBonus = 5;

                        impactScore =
                            (currentPayment.user?.impact_score ?? 0) +
                            firstDonationBonus +
                            repeatDonorBonus +
                            amountBonus +
                            completionBonus;
                        emergenciesSupported = uniqueCampaignsSupported.length;

                        await tx.user.update({
                            where: { id: currentPayment.user_id },
                            data: { impact_score: impactScore, emergencies_supported: emergenciesSupported },
                        });
                    }
                }

                campaignDonorCount = await tx.donation.count({
                    where: { campaign_id: updatedDonation.campaign_id, status: 'SUCCESS' },
                });
            }

            if (vantEventId) {
                await tx.webhook.upsert({
                    where: { payment_id: updatedPayment.id },
                    update: {
                        event: event ?? verification.raw,
                        event_type: event?.event ?? 'verification',
                        reference,
                        paystack_event_id: vantEventId,
                    },
                    create: {
                        event: event ?? verification.raw,
                        event_type: event?.event ?? 'verification',
                        reference,
                        paystack_event_id: vantEventId,
                        payment_id: updatedPayment.id,
                    },
                });
            }

            return {
                payment: updatedPayment,
                donation: updatedDonation,
                campaign: updatedCampaign,
                success: verificationSucceeded,
                alreadyProcessed: wasAlreadySuccessful && verificationSucceeded,
                campaignDonorCount,
                impactScore,
                emergenciesSupported,
            };
        });

        if (!result.alreadyProcessed) {
            await this.sendPaymentStatusEmail(result.payment, result.campaign);
        }

        return {
            data: {
                reference,
                success: result.success,
                paymentStatus: result.payment.status,
                amount: result.payment.amount,
                donationAmount: result.donation?.amount ?? this.getPaymentMetaNumber(result.payment.meta, 'donationAmount') ?? result.payment.amount,
                netDonationAmount: this.getPaymentMetaNumber(result.payment.meta, 'netDonationAmount'),
                platformFee: this.getPaymentMetaNumber(result.payment.meta, 'platformFee') ?? 0,
                tipAmount: this.getPaymentMetaNumber(result.payment.meta, 'tipAmount') ?? 0,
                totalCharged: this.getPaymentMetaNumber(result.payment.meta, 'totalCharged') ?? result.payment.amount,
                currency: result.payment.currency,
                channel: result.payment.payment_channel,
                campaignId: result.campaign?.id ?? null,
                campaignPublicId: result.campaign?.public_id ?? null,
                campaignTitle: result.campaign?.title ?? null,
                amountRaised: result.campaign?.amount_raised ?? null,
                donorCount: result.campaignDonorCount,
                alreadyProcessed: result.alreadyProcessed,
                impactScore: result.impactScore,
                emergenciesSupported: result.emergenciesSupported,
            },
        };
    }

    private async sendPaymentStatusEmail(payment: any, campaign: any) {
        if (!payment.donor_email) {
            return;
        }

        const firstName = payment.user?.first_name ?? 'there';
        const campaignTitle = campaign?.title ?? 'TorchLife campaign';
        const campaignId = campaign?.id ?? payment.meta?.metadata?.campaignId ?? 'unknown';
        const currency = payment.currency ?? 'NGN';

        if (payment.status === 'SUCCESS') {
            const htmlContent = await render(
                PaymentSuccessEmail({
                    firstName,
                    donorEmail: payment.donor_email,
                    campaignTitle,
                    campaignId,
                    amount: payment.amount,
                    currency,
                    reference: payment.tx_ref,
                    channel: payment.payment_channel ?? 'bank_transfer',
                    targetAmount: campaign?.target_amount ?? null,
                    amountRaised: campaign?.amount_raised ?? null,
                }),
            );

            await this.EmailService.sendEmail(payment.donor_email, 'TorchLife donation payment successful', htmlContent);
            return;
        }

        const htmlContent = await render(
            PaymentFailureEmail({
                firstName,
                donorEmail: payment.donor_email,
                campaignTitle,
                campaignId,
                amount: payment.amount,
                currency,
                reference: payment.tx_ref,
                reason: payment.comment ?? null,
            }),
        );

        await this.EmailService.sendEmail(payment.donor_email, 'TorchLife donation payment update', htmlContent);
    }

    private async recordWebhookEvent(event: Record<string, any>, paymentId: string, reference: string | null) {
        const vantEventId = this.buildWebhookEventId(event, reference, event?.sessionId);

        if (vantEventId) {
            const existing = await this.prisma.webhook.findUnique({
                where: { paystack_event_id: vantEventId },
            });

            if (existing) {
                return existing;
            }
        }

        return this.prisma.webhook.upsert({
            where: { payment_id: paymentId },
            update: {
                event,
                event_type: event?.event ?? null,
                reference,
                paystack_event_id: vantEventId,
            },
            create: {
                event,
                event_type: event?.event ?? null,
                reference,
                paystack_event_id: vantEventId,
                payment_id: paymentId,
            },
        });
    }

    private buildWebhookEventId(event: Record<string, any> | undefined, reference: string | null, transactionId?: unknown) {
        if (!event?.event && !reference && !transactionId) {
            return null;
        }

        return ['vant', event?.event ?? 'verification', reference ?? 'no-reference', transactionId ?? 'no-id'].join(':');
    }

    private getPaymentMetaNumber(meta: unknown, key: string) {
        if (!meta || typeof meta !== 'object') {
            return null;
        }

        const metaRecord = meta as Record<string, unknown>;
        const directValue = metaRecord[key];

        if (typeof directValue === 'number') {
            return directValue;
        }

        const nestedMetadata = metaRecord.metadata;

        if (nestedMetadata && typeof nestedMetadata === 'object') {
            const nestedValue = (nestedMetadata as Record<string, unknown>)[key];
            if (typeof nestedValue === 'number') {
                return nestedValue;
            }
        }

        return null;
    }

    private generateReference() {
        return `torchlife-vant-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    }

    private getPaymentMetaString(meta: unknown, key: string) {
        if (!meta || typeof meta !== 'object') {
            return null;
        }

        const metaRecord = meta as Record<string, unknown>;
        const initialization = metaRecord.initialization;

        if (initialization && typeof initialization === 'object') {
            const value = (initialization as Record<string, unknown>)[key];
            if (typeof value === 'string') {
                return value;
            }
        }

        return null;
    }
}
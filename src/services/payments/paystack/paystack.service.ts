import {
    BadRequestException,
    InternalServerErrorException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InitializePaystackDonationDto } from './dto/initialize-paystack-donation.dto';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { PaystackInboundService } from '../inbound-providers/paystack.provider';
import { render } from '@react-email/components';
import { EmailService } from 'src/services/email-transport/email-transport.service';
import PaymentSuccessEmail from 'src/domain/email-templates/payment-success';
import PaymentFailureEmail from 'src/domain/email-templates/payment-failure';
import * as crypto from 'crypto';
import { UserService } from 'src/services/user/user.service';

type VerificationResult = Awaited<ReturnType<PaystackInboundService['verifyPayment']>>;

@Injectable()
export class PaystackService {
    private readonly logger = new Logger(PaystackService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paystackProvider: PaystackInboundService,
        private readonly EmailService: EmailService,
        private readonly userService: UserService,
    ) { }

    async initializeDonation(dto: InitializePaystackDonationDto) {
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

        const reference = this.generateReference();
        const currency = dto.currency ?? campaign.currency ?? 'NGN';
        const isAnonymous = dto.anonymous ?? false;
        const donationAmount = dto.amount;
        const tipAmount = dto.tipAmount ?? 0;
        const platformFee = Math.round(donationAmount * 0.025) + 200;
        const netDonationAmount = donationAmount - platformFee;

        if (netDonationAmount < 1) {
            throw new BadRequestException('Donation amount must be higher than the processing fee');
        }

        const totalCharged = donationAmount + tipAmount;
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

        const callbackUrl = this.resolveCallbackUrl(dto.callbackUrl);
        const initializedPayment = await this.paystackProvider.initializePayment({
            email: donor.email,
            amount: totalCharged,
            tx_ref: reference,
            currency,
            metadata,
            channels: ['card', 'bank_transfer'],
            callback_url: callbackUrl,
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
                    tx_ref: initializedPayment.reference,
                    custom_tx_ref: donation.id,
                    type: 'DEPOSIT',
                    currency,
                    provider: 'paystack',
                    donation_id: donation.id,
                    user_id: donor.id,
                    donor_email: donor.email,
                    meta: {
                        metadata,
                        initialization: {
                            accessCode: initializedPayment.access_code,
                            authorizationUrl: initializedPayment.authorization_url,
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
                authorizationUrl: initializedPayment.authorization_url,
                accessCode: initializedPayment.access_code,
                reference: initializedPayment.reference,
                amount: donationAmount,
                platformFee,
                tipAmount,
                totalCharged,
                currency,
                channels: ['card', 'bank_transfer'],
                metadata,
                anonymous: isAnonymous,
                donorEmail: donor.email,
            },
        };
    }

    private resolveCallbackUrl(candidate?: string | null) {
        const configuredUrl =
            candidate?.trim() ||
            process.env.PAYSTACK_CALLBACK_URL ||
            process.env.FRONTEND_URL ||
            process.env.NEXT_PUBLIC_SITE_URL;

        if (!configuredUrl) {
            throw new InternalServerErrorException('Payment callback URL is not configured');
        }

        try {
            const parsed = new URL(configuredUrl);

            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('Invalid protocol');
            }

            if (!parsed.pathname || parsed.pathname === '/') {
                parsed.pathname = '/payments/callback';
            }

            return parsed.toString();
        } catch {
            throw new InternalServerErrorException('Payment callback URL is invalid');
        }
    }

    async verifyTransaction(reference: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { tx_ref: reference },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        const verification = await this.paystackProvider.verifyPayment({
            reference,
            currency: payment.currency,
        });

        return this.reconcilePayment(reference, verification, undefined);
    }

    async getDonationHistory(user: AuthUser) {
        const payments = await this.prisma.payment.findMany({
            where: {
                user_id: user.id,
                donation_id: { not: null },
            },
            orderBy: {
                created_at: 'desc',
            },
            include: {
                donation: {
                    include: {
                        campaign: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });

        return {
            data: payments.map((payment) => ({
                id: payment.id,
                amount: payment.donation?.amount ?? this.getPaymentMetaNumber(payment.meta, 'donationAmount') ?? payment.amount,
                status: payment.status,
                currency: payment.currency,
                reference: payment.tx_ref,
                createdAt: payment.created_at,
                paymentMethod: payment.provider ?? 'paystack',
                donationStatus: payment.donation?.status ?? null,
                anonymous: payment.donation?.is_anonymous ?? false,
                campaign: payment.donation?.campaign
                    ? {
                        id: payment.donation.campaign.id,
                        title: payment.donation.campaign.title,
                        creator: payment.donation.campaign.user
                            ? {
                                id: payment.donation.campaign.user.id,
                                first_name: payment.donation.campaign.user.first_name,
                                last_name: payment.donation.campaign.user.last_name,
                            }
                            : null,
                    }
                    : null,
            })),
        };
    }

    async getRecentDonationTicker() {
        const donations = await this.prisma.donation.findMany({
            where: {
                status: 'SUCCESS',
                deleted_at: null,
                campaign: {
                    is_deleted: false,
                    status: 'APPROVED',
                },
            },
            orderBy: {
                created_at: 'desc',
            },
            take: 20,
            include: {
                user: {
                    select: {
                        philanthropic_name: true,
                    },
                },
                campaign: {
                    select: {
                        id: true,
                        public_id: true,
                        title: true,
                        currency: true,
                    },
                },
            },
        });

        return {
            data: donations.map((donation) => ({
                id: donation.id,
                amount: donation.amount,
                currency: donation.campaign?.currency ?? 'NGN',
                createdAt: donation.created_at,
                donorLabel: donation.is_anonymous
                    ? 'Anonymous'
                    : donation.user?.philanthropic_name || 'Anonymous',
                anonymous: donation.is_anonymous,
                campaign: donation.campaign
                    ? {
                        id: donation.campaign.id,
                        publicId: donation.campaign.public_id,
                        title: donation.campaign.title,
                    }
                    : null,
            })),
        };
    }

    async processWebhookEvent(event: Record<string, any>) {
        const reference = event?.data?.reference;
        if (!reference) {
            this.logger.warn('Received Paystack webhook without transaction reference');
            return { received: true, ignored: true, reason: 'missing_reference' };
        }

        const payment = await this.prisma.payment.findUnique({
            where: { tx_ref: reference },
        });

        if (!payment) {
            this.logger.warn(`Received Paystack webhook for unknown reference ${reference}`);
            return { received: true, ignored: true, reason: 'payment_not_found' };
        }

        if (event?.event !== 'charge.success') {
            await this.recordWebhookEvent(event, payment.id);
            return { received: true, ignored: true, reason: 'unsupported_event' };
        }

        const verification = await this.paystackProvider.verifyPayment({
            reference,
            currency: payment.currency,
        });

        return this.reconcilePayment(reference, verification, event);
    }

    private async reconcilePayment(reference: string, verification: VerificationResult, event?: Record<string, any>) {
        const payment = await this.prisma.payment.findUnique({
            where: { tx_ref: reference },
            include: {
                donation: {
                    include: {
                        campaign: true,
                    },
                },
                user: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        const amountMatches = verification.amount === payment.amount;
        const currencyMatches = verification.currency === payment.currency;
        const verificationSucceeded = verification.success && amountMatches && currencyMatches;
        const failureReason = !verification.success
            ? verification.gatewayResponse ?? 'Payment was not successful on Paystack'
            : !amountMatches
                ? 'Verified amount does not match the expected donation amount'
                : !currencyMatches
                    ? 'Verified currency does not match the expected donation currency'
                    : null;

        const paystackEventId = this.buildWebhookEventId(event, reference, verification.transactionId);

        const result = await this.prisma.$transaction(async (tx) => {
            if (paystackEventId) {
                const existingWebhook = await tx.webhook.findUnique({
                    where: { paystack_event_id: paystackEventId },
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
                    donation: {
                        include: {
                            campaign: true,
                        },
                    },
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
                    paystack_transaction_id:
                        verification.transactionId !== null && verification.transactionId !== undefined
                            ? BigInt(String(verification.transactionId))
                            : currentPayment.paystack_transaction_id,
                    comment: failureReason ?? verification.gatewayResponse ?? currentPayment.comment,
                    meta: {
                        ...(typeof currentPayment.meta === 'object' && currentPayment.meta ? currentPayment.meta : {}),
                        paystack: verification.raw,
                        verifiedMetadata: verification.metadata ?? null,
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
                    include: {
                        campaign: true,
                    },
                });

                updatedCampaign = updatedDonation.campaign;

                if (verificationSucceeded && !wasAlreadySuccessful) {
                    const netDonationAmount =
                        this.getPaymentMetaNumber(updatedPayment.meta, 'netDonationAmount') ?? updatedDonation.amount;
                    updatedCampaign = await tx.campaign.update({
                        where: { id: updatedDonation.campaign_id },
                        data: {
                            amount_raised: {
                                increment: netDonationAmount,
                            },
                        },
                    });

                    if (currentPayment.user_id) {
                        const successfulDonations = await tx.donation.count({
                            where: {
                                user_id: currentPayment.user_id,
                                status: 'SUCCESS',
                            },
                        });
                        const uniqueCampaignsSupported = await tx.donation.findMany({
                            where: {
                                user_id: currentPayment.user_id,
                                status: 'SUCCESS',
                            },
                            select: {
                                campaign_id: true,
                            },
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
                            data: {
                                impact_score: impactScore,
                                emergencies_supported: emergenciesSupported,
                            },
                        });
                    }
                }

                campaignDonorCount = await tx.donation.count({
                    where: {
                        campaign_id: updatedDonation.campaign_id,
                        status: 'SUCCESS',
                    },
                });
            }

            if (paystackEventId) {
                await tx.webhook.upsert({
                    where: { payment_id: updatedPayment.id },
                    update: {
                        event: event ?? verification.raw,
                        event_type: event?.event ?? 'verification',
                        reference,
                        paystack_event_id: paystackEventId,
                    },
                    create: {
                        event: event ?? verification.raw,
                        event_type: event?.event ?? 'verification',
                        reference,
                        paystack_event_id: paystackEventId,
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
                    channel: payment.payment_channel ?? 'unknown',
                    targetAmount: campaign?.target_amount ?? null,
                    amountRaised: campaign?.amount_raised ?? null,
                }),
            );

            await this.EmailService.sendEmail(
                payment.donor_email,
                'TorchLife donation payment successful',
                htmlContent
            );
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

        await this.EmailService.sendEmail(
            payment.donor_email,
            'TorchLife donation payment update',
            htmlContent
        );
    }

    private async recordWebhookEvent(event: Record<string, any>, paymentId: string) {
        const reference = event?.data?.reference ?? null;
        const paystackEventId = this.buildWebhookEventId(event, reference, event?.data?.id);

        if (paystackEventId) {
            const existing = await this.prisma.webhook.findUnique({
                where: { paystack_event_id: paystackEventId },
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
                paystack_event_id: paystackEventId,
            },
            create: {
                event,
                event_type: event?.event ?? null,
                reference,
                paystack_event_id: paystackEventId,
                payment_id: paymentId,
            },
        });
    }

    private buildWebhookEventId(event: Record<string, any> | undefined, reference: string, transactionId?: unknown) {
        if (!event?.event && !reference && !transactionId) {
            return null;
        }

        return [event?.event ?? 'verification', reference ?? 'no-reference', transactionId ?? 'no-id'].join(':');
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
        return `torchlife-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    }
}

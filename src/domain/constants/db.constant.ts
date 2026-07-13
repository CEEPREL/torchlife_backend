import type { Prisma } from '@prisma/client';

export class DbDataConstant {
    static userData: Prisma.UserSelect = {
        id: true,
        first_name: true,
        last_name: true,
        philanthropic_name: true,
        impact_score: true,
        emergencies_supported: true,
        email: true,
        phone_number: true,
        role: true,
        activities: true,
        isverified: true,
        created_at: true,
        updated_at: true,
    };

    static campaignData: Prisma.CampaignSelect = {
        id: true,
        user_id: true,
        public_id: true,
        title: true,
        story: true,
        records: true,
        priority: true,
        location: true,
        hospital_name: true,
        hospital_contact: true,
        hospital_contact_person_name: true,
        status: true,
        is_deleted: true,
        deleted_at: true,
        deleted_by_id: true,
        deadline: true,
        extension_status: true,
        requested_deadline: true,
        extension_requested_at: true,
        extension_reviewed_at: true,
        target_amount: true,
        amount_raised: true,
        certified_pdf: true,
        image_url: true,
        currency: true,
        type: true,
        proxyName: true,
        proxyNote: true,
        proxyPhone: true,
        proxyEmail: true,
        approved_by_id: true,
        approved_at: true,
        approval_notes: true,
        created_at: true,
        updated_at: true,
        donations: {
            select: {
                id: true,
            },
        },
        user: {
            select: DbDataConstant.userData,
        },
        verified_by: {
            select: DbDataConstant.userData,
        },
    };

    static donationData: Prisma.DonationSelect = {
        id: true,
        amount: true,
        status: true,
        created_at: true,
        updated_at: true,
        user: {
            select: DbDataConstant.userData,
        },
        campaign: {
            select: DbDataConstant.campaignData,
        },
    };

    static paymentData: Prisma.PaymentSelect = {
        id: true,
        amount: true,
        tx_ref: true,
        custom_tx_ref: true,
        status: true,
        type: true,
        currency: true,
        created_at: true,
        updated_at: true,
        user: {
            select: DbDataConstant.userData,
        },
        donation: {
            select: DbDataConstant.donationData,
        },
    };

    static walletData: Prisma.WalletSelect = {
        id: true,
        balance: true,
        currency: true,
        account_status: true,
        user: {
            select: DbDataConstant.userData,
        },
        campaign: {
            select: DbDataConstant.campaignData,
        },
    };

    static walletTransactionData: Prisma.WalletTransactionSelect = {
        id: true,
        amount: true,
        type: true,
        currency: true,
        status: true,
        reference: true,
        description: true,
        created_at: true,
        updated_at: true,
        wallet: {
            select: DbDataConstant.walletData,
        },
    };

    static ratingData: Prisma.RatingSelect = {
        id: true,
        score: true,
        comment: true,
        created_at: true,
        updated_at: true,
        user: {
            select: DbDataConstant.userData,
        },
        campaign: {
            select: DbDataConstant.campaignData,
        },
    };
    static withdrawalRequestData: Prisma.WithdrawalRequestSelect = {
        id: true,
        amount: true,
        status: true,
        reason: true,
        initiated_at: true,
        processed_at: true,
        user_id: true,
        wallet_id: true,
        payment: {
            select: DbDataConstant.paymentData,
        },
    };
    static webhookData: Prisma.WebhookSelect = {
        id: true,
        event: true,
        event_type: true,
        reference: true,
        paystack_event_id: true,
        created_at: true,
        updated_at: true,
    };
}

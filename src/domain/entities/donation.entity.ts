import { DonationStatus } from '../enums/donation-status.enum';

export class Donation {
    constructor(
        public id: string,
        public campaignId: string,
        public userId: string,
        public amount: number,
        public status: DonationStatus = DonationStatus.PENDING,
        public createdAt: Date = new Date(),
    ) {}

    static create(data: {
        id: string;
        campaignId: string;
        userId: string;
        amount: number;
        status?: DonationStatus;
        createdAt?: Date;
    }): Donation {
        return new Donation(
            data.id,
            data.campaignId,
            data.userId,
            data.amount,
            data.status ?? DonationStatus.PENDING,
            data.createdAt ?? new Date(),
        );
    }

    isSuccessful(): boolean {
        return this.status === DonationStatus.SUCCESS;
    }

    hasFailed(): boolean {
        return this.status === DonationStatus.FAILED || this.status === DonationStatus.REJECTED;
    }
}

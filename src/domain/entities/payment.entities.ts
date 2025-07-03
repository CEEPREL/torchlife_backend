import { PaymentStatus } from '../enums/payment-status.enum';

export class Payment {
    constructor(
        public id: string,
        public amount: number,
        public status: PaymentStatus,
        public donationId: string,
        public userId: string,
        public syncedAt?: Date,
        public txRef?: string,
        public customTxRef?: string,
        public comment?: string,
        public createdAt: Date = new Date(),
    ) {}

    isConfirmed(): boolean {
        return this.status === PaymentStatus.SUCCESS;
    }
}

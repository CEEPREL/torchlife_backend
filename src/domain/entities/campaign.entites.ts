import { CampaignStatus } from '../enums/campaign-status.enum';

export class Campaign {
    constructor(
        public id: string,
        public title: string,
        public story: string,
        public targetAmount: number,
        public amountRaised: number = 0,
        public status: CampaignStatus = CampaignStatus.PENDING,
        public deadline: Date,
        public userId: string,
        public certifiedPdf: string,
        public imageUrl: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public donations: any[] = [],
    ) {}

    isLive(): boolean {
        return this.status === CampaignStatus.APPROVED && !this.isExpired();
    }

    isExpired(): boolean {
        return new Date() > this.deadline;
    }

    getRemainingAmount(): number {
        return this.targetAmount - this.amountRaised;
    }

    getProgressPercentage(): number {
        return (this.amountRaised / this.targetAmount) * 100;
    }

    getProgressBar(): string {
        const progress = this.getProgressPercentage();
        const blocksFilled = Math.round(progress / 10);
        return '█'.repeat(blocksFilled) + '░'.repeat(10 - blocksFilled);
    }

    splitTargetInto(slots: number): number[] {
        const chunk = this.targetAmount / slots;
        return Array.from({ length: slots }, () => chunk);
    }
}

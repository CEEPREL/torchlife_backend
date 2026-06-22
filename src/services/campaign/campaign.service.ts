import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignCurrency, CampaignPriority, CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginate, PaginationOptions } from 'src/shared/utils/pagination/pagination';
import { UploadService } from 'src/services/upload/upload.service';
import { DbDataConstant } from 'src/domain/constants/db.constant';
import { CampaignStatus } from 'src/domain/enums/campaign-status.enum';
import { CampaignType } from './dto/create-campaign.dto';
import { UserRole } from 'src/domain/enums/user-role.enum';
import { EmailTransportService } from '../email-transport/email-transport.service';
import { render } from '@react-email/components';
import CampaignApprovedEmail from 'src/domain/email-templates/campaign-approved';
import { RequestCampaignExtensionDto } from './dto/request-extension.dto';
import { ReviewCampaignExtensionDto } from './dto/review-extension.dto';
import { ReviewCampaignDto } from './dto/review-campaign.dto';
import { ExtendCampaignDto } from './dto/extend-campaign.dto';

export type CampaignExtensionStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

type CampaignCreateFiles = {
    image?: Express.Multer.File[];
    image_url?: Express.Multer.File[];
    certified_pdf?: Express.Multer.File[];
    records?: Express.Multer.File[];
    record?: Express.Multer.File[];
};

@Injectable()
export class CampaignService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
        private emailTransportService: EmailTransportService,
    ) { }

    private isUuid(value: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    private buildDefaultDeadline() {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 2);
        deadline.setHours(23, 59, 59, 999);
        return deadline;
    }

    private buildMaxCreationDeadline() {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 2);
        deadline.setHours(23, 59, 59, 999);
        return deadline;
    }

    private async recordExtensionAudit(campaignId: string, adminId: string, oldDeadline: Date, newDeadline: Date) {
        await this.prisma.campaignExtensionAudit.create({
            data: {
                campaign_id: campaignId,
                admin_id: adminId,
                old_deadline: oldDeadline,
                new_deadline: newDeadline,
            },
        });
    }

    private async findCampaignRecord(identifier: string, options?: { includeDeleted?: boolean }) {
        const identifierClauses = this.isUuid(identifier)
            ? [{ id: identifier }, { public_id: identifier }]
            : [{ public_id: identifier }];

        return this.prisma.campaign.findFirst({
            where: {
                OR: identifierClauses,
                ...(options?.includeDeleted ? {} : { is_deleted: false }),
            },
            include: {
                user: {
                    select: { id: true, first_name: true, last_name: true, email: true, philanthropic_name: true },
                },
                donations: true,
                ratings: true,
                fileUploads: true,
            },
        });
    }

    async create(userId: string, dto: CreateCampaignDto, files?: CampaignCreateFiles) {
        if (dto.type === CampaignType.PROXY) {
            if (!dto.proxyName || !dto.proxyEmail || !dto.proxyPhone) {
                throw new BadRequestException('Missing proxy fields for PROXY campaign');
            }
        }

        if (!dto.hospital_name) {
            throw new BadRequestException('Hospital name is required');
        }

        if (!dto.hospital_contact) {
            throw new BadRequestException('Hospital contact phone is required');
        }

        const imageFile = files?.image?.[0] ?? files?.image_url?.[0];
        const certifiedPdfFile = files?.certified_pdf?.[0];
        const supportingRecordFiles = [...(files?.records ?? []), ...(files?.record ?? [])];
        const supportingRecordUrls = dto.records ?? [];

        if (!dto.image_url && !imageFile) {
            throw new BadRequestException('Campaign cover image is required');
        }

        if (!dto.certified_pdf && !certifiedPdfFile) {
            throw new BadRequestException('Certified PDF document is required');
        }

        const duplicateCampaign = await this.prisma.campaign.findFirst({
            where: {
                user_id: userId,
                is_deleted: false,
                title: dto.title,
                story: dto.story,
                status: {
                    in: [CampaignStatus.PENDING, CampaignStatus.APPROVED],
                },
            },
            select: { id: true },
        });

        if (duplicateCampaign) {
            throw new BadRequestException('A similar campaign already exists for this account');
        }

        const requestedDeadline = dto.deadline ? new Date(dto.deadline) : this.buildDefaultDeadline();
        if (Number.isNaN(requestedDeadline.getTime())) {
            throw new BadRequestException('Campaign deadline is invalid');
        }

        const now = new Date();
        const maxCreationDeadline = this.buildMaxCreationDeadline();

        if (requestedDeadline < now) {
            throw new BadRequestException('Campaign deadline cannot be in the past');
        }

        if (requestedDeadline > maxCreationDeadline) {
            throw new BadRequestException('Campaign deadline cannot exceed the 3-day submission window');
        }

        const createdCampaign = await this.prisma.campaign.create({
            data: {
                title: dto.title,
                story: dto.story,
                records: supportingRecordUrls,
                certified_pdf: dto.certified_pdf ?? '',
                image_url: dto.image_url ?? '',
                deadline: requestedDeadline,
                target_amount: dto.target_amount,
                amount_raised: 0,
                type: dto.type,
                status: CampaignStatus.PENDING,
                user_id: userId,
                verified_by_id: userId,
                proxyName: dto.proxyName ?? null,
                proxyNote: dto.proxyNote ?? null,
                proxyPhone: dto.proxyPhone ?? null,
                proxyEmail: dto.proxyEmail ?? null,
                location: dto.location ?? null,
                hospital_name: dto.hospital_name ?? null,
                hospital_contact: dto.hospital_contact ?? null,
                hospital_contact_person_name: dto.hospital_contact_person_name ?? null,
                priority: dto.priority ?? CampaignPriority.LOW,
                currency: dto.currency ?? CampaignCurrency.NGN,
            },
            select: DbDataConstant.campaignData,
        });

        const uploadedRecordUrls: string[] = [];
        let uploadedImageUrl = dto.image_url ?? '';
        let uploadedCertifiedPdfUrl = dto.certified_pdf ?? '';

        if (imageFile) {
            const uploadedImage = await this.uploadService.uploadFile(
                imageFile,
                createdCampaign.id,
                userId,
            );
            uploadedImageUrl = uploadedImage.url;
        }

        if (certifiedPdfFile) {
            const uploadedCertifiedPdf = await this.uploadService.uploadFile(
                certifiedPdfFile,
                createdCampaign.id,
                userId,
            );
            uploadedCertifiedPdfUrl = uploadedCertifiedPdf.url;
        }

        for (const recordFile of supportingRecordFiles) {
            const uploadedRecord = await this.uploadService.uploadFile(
                recordFile,
                createdCampaign.id,
                userId,
            );
            uploadedRecordUrls.push(uploadedRecord.url);
        }

        if (
            uploadedImageUrl !== createdCampaign.image_url ||
            uploadedCertifiedPdfUrl !== createdCampaign.certified_pdf ||
            uploadedRecordUrls.length > 0
        ) {
            return this.prisma.campaign.update({
                where: { id: createdCampaign.id },
                data: {
                    image_url: uploadedImageUrl,
                    certified_pdf: uploadedCertifiedPdfUrl,
                    records: [...supportingRecordUrls, ...uploadedRecordUrls],
                },
                select: DbDataConstant.campaignData,
            });
        }

        return createdCampaign;
    }

    async findAllByUser(userId: string, options: PaginationOptions) {
        const settings = {
            defaultLimit: 10,
            maxLimit: 50,
        };

        const page = options.page ?? 1;
        const limit = options.limit ?? settings.defaultLimit;
        const skip = (page - 1) * limit;

        return paginate(
            async () => {
                const [campaigns, total] = await this.prisma.$transaction([
                    this.prisma.campaign.findMany({
                        where: { user_id: userId, is_deleted: false },
                        orderBy: { created_at: 'desc' },
                        skip,
                        take: limit,
                        select: DbDataConstant.campaignData,
                    }),
                    this.prisma.campaign.count({
                        where: { user_id: userId, is_deleted: false },
                    }),
                ]);
                return [campaigns, total];
            },
            options,
            settings,
        );
    }

    findAll(options: PaginationOptions = {}, includeDeleted = false, search?: string) {
        const settings = {
            defaultLimit: 10,
            maxLimit: 50,
        };

        const normalizedSearch = search?.trim();
        const where = normalizedSearch
            ? {
                ...(includeDeleted ? {} : { is_deleted: false }),
                OR: [
                    { title: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { location: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { hospital_name: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { proxyName: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { proxyEmail: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    {
                        user: {
                            first_name: { contains: normalizedSearch, mode: 'insensitive' as const },
                        },
                    },
                    {
                        user: {
                            last_name: { contains: normalizedSearch, mode: 'insensitive' as const },
                        },
                    },
                    {
                        user: {
                            philanthropic_name: { contains: normalizedSearch, mode: 'insensitive' as const },
                        },
                    },
                ],
            }
            : includeDeleted
                ? {}
                : { is_deleted: false };

        return paginate(
            async (skip, limit) => {
                const [campaigns, total] = await this.prisma.$transaction([
                    this.prisma.campaign.findMany({
                        where,
                        orderBy: { created_at: 'desc' },
                        skip,
                        take: limit,
                        select: DbDataConstant.campaignData,
                    }),
                    this.prisma.campaign.count({ where }),
                ]);
                return [campaigns, total];
            },
            options,
            settings,
        );
    }

    async findAllAdmin(user: { id: string; role: UserRole }, options: PaginationOptions = {}, search?: string) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view all campaigns');
        }

        const paginated = await this.findAll(options, true, search);
        const proxyOwnerIds = Array.from(
            new Set(
                paginated.data
                    .filter((campaign) => campaign.type === UserRole.PROXY)
                    .map((campaign) => campaign.user_id),
            ),
        );

        if (proxyOwnerIds.length === 0) {
            return paginated;
        }

        const proxyCampaigns = await this.prisma.campaign.findMany({
            where: {
                user_id: { in: proxyOwnerIds },
                type: UserRole.PROXY,
                is_deleted: false,
            },
            select: {
                user_id: true,
                amount_raised: true,
            },
        });

        const proxySummary = proxyCampaigns.reduce<Record<string, { count: number; totalRaised: number }>>(
            (accumulator, campaign) => {
                const current = accumulator[campaign.user_id] ?? { count: 0, totalRaised: 0 };
                current.count += 1;
                current.totalRaised += campaign.amount_raised;
                accumulator[campaign.user_id] = current;
                return accumulator;
            },
            {},
        );

        return {
            ...paginated,
            data: paginated.data.map((campaign) => ({
                ...campaign,
                proxy_campaign_count:
                    campaign.type === UserRole.PROXY ? (proxySummary[campaign.user_id]?.count ?? 0) : undefined,
                proxy_total_raised:
                    campaign.type === UserRole.PROXY
                        ? (proxySummary[campaign.user_id]?.totalRaised ?? 0)
                        : undefined,
            })),
        };
    }

    async findOneById(id: string) {
        const campaign = await this.findCampaignRecord(id);

        if (!campaign) throw new NotFoundException(`Campaign with ID ${id} not found`);
        return campaign;
    }

    async findPublicByPublicId(publicId: string) {
        const campaign = await this.findCampaignRecord(publicId);

        if (!campaign || campaign.status !== CampaignStatus.APPROVED) {
            throw new NotFoundException(`Campaign with public ID ${publicId} not found`);
        }

        return campaign;
    }

    async findOneForViewer(user: { id: string; role: UserRole }, id: string) {
        const includeDeleted = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        const campaign = await this.findCampaignRecord(id, { includeDeleted });

        if (!campaign) {
            throw new NotFoundException(`Campaign with ID ${id} not found`);
        }

        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        const isOwner = campaign.user_id === user.id;

        if (campaign.is_deleted && !isAdmin) {
            throw new NotFoundException(`Campaign with ID ${id} not found`);
        }

        if (!isAdmin && !isOwner && campaign.status !== CampaignStatus.APPROVED) {
            throw new ForbiddenException('You are not authorized to view this campaign');
        }

        return campaign;
    }

    async update(user: { id: string; role: UserRole }, campaignId: string, dto: UpdateCampaignDto) {
        const campaign = await this.findOneById(campaignId);
        if (!campaign) throw new NotFoundException();

        if (campaign.user_id !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('You are not authorized to update this campaign');
        }

        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

        if (!isAdmin && (dto.status !== undefined || dto.approval_notes !== undefined || dto.approvalNotes !== undefined)) {
            throw new ForbiddenException('Only admins can update campaign status and approval notes');
        }

        const normalizedDeadline = dto.deadline ? new Date(dto.deadline) : undefined;
        if (dto.deadline && (!normalizedDeadline || Number.isNaN(normalizedDeadline.getTime()))) {
            throw new BadRequestException('Campaign deadline is invalid');
        }

        const dtoValues = dto as Record<string, unknown>;
        const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(dtoValues, key);
        const resolveValue = (...keys: string[]) => {
            for (const key of keys) {
                if (hasOwn(key)) {
                    return dtoValues[key];
                }
            }

            return undefined;
        };

        const updateData: Record<string, unknown> = {};

        if (hasOwn('title')) updateData.title = dto.title;
        if (hasOwn('story')) updateData.story = dto.story;
        if (hasOwn('deadline')) updateData.deadline = normalizedDeadline;
        if (hasOwn('target_amount') || hasOwn('targetAmount')) {
            updateData.target_amount = dto.target_amount ?? dto.targetAmount;
        }
        if (hasOwn('currency')) updateData.currency = dto.currency;
        if (hasOwn('location')) updateData.location = dto.location ?? null;
        if (hasOwn('priority')) updateData.priority = dto.priority;
        if (hasOwn('type')) updateData.type = dto.type;
        if (hasOwn('image_url') || hasOwn('imageUrl')) {
            const nextImageUrl = dto.image_url ?? dto.imageUrl;
            if (!nextImageUrl) {
                throw new BadRequestException('Campaign cover image is required');
            }
            updateData.image_url = nextImageUrl;
        }
        if (hasOwn('certified_pdf') || hasOwn('certifiedPdf')) {
            const nextCertifiedPdf = dto.certified_pdf ?? dto.certifiedPdf;
            if (!nextCertifiedPdf) {
                throw new BadRequestException('Certified PDF document is required');
            }
            updateData.certified_pdf = nextCertifiedPdf;
        }
        if (hasOwn('records') || hasOwn('record')) {
            updateData.records = dto.records ?? dto.record ?? [];
        }
        if (hasOwn('proxyName') || hasOwn('proxy_name')) {
            updateData.proxyName = resolveValue('proxyName', 'proxy_name') ?? null;
        }
        if (hasOwn('proxyPhone') || hasOwn('proxy_phone')) {
            updateData.proxyPhone = resolveValue('proxyPhone', 'proxy_phone') ?? null;
        }
        if (hasOwn('proxyEmail') || hasOwn('proxy_email')) {
            updateData.proxyEmail = resolveValue('proxyEmail', 'proxy_email') ?? null;
        }
        if (hasOwn('proxyNote') || hasOwn('proxy_note')) {
            updateData.proxyNote = resolveValue('proxyNote', 'proxy_note') ?? null;
        }
        if (hasOwn('hospital_name') || hasOwn('hospitalName')) {
            updateData.hospital_name = resolveValue('hospital_name', 'hospitalName') ?? null;
        }
        if (hasOwn('hospital_contact') || hasOwn('hospitalContact')) {
            updateData.hospital_contact = resolveValue('hospital_contact', 'hospitalContact') ?? null;
        }
        if (hasOwn('hospital_contact_person_name') || hasOwn('hospitalContactPersonName')) {
            updateData.hospital_contact_person_name =
                resolveValue('hospital_contact_person_name', 'hospitalContactPersonName') ?? null;
        }

        const nextType = (updateData.type as CampaignType | undefined) ?? campaign.type;
        if (nextType === CampaignType.PROXY) {
            const nextProxyName = (updateData.proxyName as string | null | undefined) ?? campaign.proxyName;
            const nextProxyPhone = (updateData.proxyPhone as string | null | undefined) ?? campaign.proxyPhone;
            const nextProxyEmail = (updateData.proxyEmail as string | null | undefined) ?? campaign.proxyEmail;

            if (!nextProxyName || !nextProxyPhone || !nextProxyEmail) {
                throw new BadRequestException('Proxy campaigns require beneficiary name, phone, and email');
            }
        }

        if (isAdmin) {
            if (dto.status !== undefined) {
                updateData.status = dto.status;
                updateData.approved_by_id = user.id;
                if (dto.status === CampaignStatus.APPROVED) {
                    updateData.approved_at = campaign.approved_at ?? new Date();
                }
            }

            if (dto.approval_notes !== undefined || dto.approvalNotes !== undefined) {
                updateData.approval_notes = dto.approval_notes ?? dto.approvalNotes ?? null;
            }
        }

        return this.prisma.campaign.update({
            where: { id: campaign.id },
            data: Object.fromEntries(
                Object.entries(updateData).filter(([, value]) => value !== undefined),
            ),
            select: DbDataConstant.campaignData,
        });
    }

    async remove(user: { id: string; role: UserRole }, campaignId: string) {
        const campaign = await this.findOneById(campaignId);
        if (!campaign) throw new NotFoundException();

        if (campaign.user_id !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('You are not authorized to delete this campaign');
        }

        return this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                deleted_by_id: user.id,
            },
        });
    }

    async approveCampaign(user: { id: string; role: UserRole }, campaignId: string, dto?: ReviewCampaignDto) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can approve campaigns');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaign) throw new NotFoundException();
        if (campaign.is_deleted) {
            throw new BadRequestException('Deleted campaigns cannot be approved');
        }
        if (campaign.status === CampaignStatus.APPROVED) {
            throw new BadRequestException('Campaign has already been approved');
        }

        const updatedCampaign = await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status: CampaignStatus.APPROVED,
                approved_by_id: user.id,
                approved_at: new Date(),
                approval_notes: dto?.notes ?? null,
                approval_email_sent: true,
            },
            include: {
                user: {
                    select: {
                        first_name: true,
                        email: true,
                    },
                },
            },
        });

        if (updatedCampaign.user?.email && !campaign.approval_email_sent) {
            const htmlContent = await render(
                CampaignApprovedEmail({
                    firstName: updatedCampaign.user.first_name,
                    campaignTitle: updatedCampaign.title,
                    campaignId: updatedCampaign.id,
                    status: updatedCampaign.status,
                    currency: updatedCampaign.currency,
                    targetAmount: updatedCampaign.target_amount,
                    amountRaised: updatedCampaign.amount_raised,
                    deadline: updatedCampaign.deadline.toISOString(),
                    location: updatedCampaign.location,
                }),
            );

            await this.emailTransportService.sendMail({
                to: updatedCampaign.user.email,
                subject: 'Your TorchLife campaign has been approved',
                name: updatedCampaign.user.first_name,
                content: htmlContent,
            });
        }

        return updatedCampaign;
    }

    async rejectCampaign(user: { id: string; role: UserRole }, campaignId: string, dto?: ReviewCampaignDto) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can reject campaigns');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaign) throw new NotFoundException();
        if (campaign.is_deleted) {
            throw new BadRequestException('Deleted campaigns cannot be rejected');
        }
        if (campaign.status === CampaignStatus.APPROVED) {
            throw new BadRequestException('Approved campaigns cannot be rejected');
        }

        return this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status: CampaignStatus.REJECTED,
                approval_notes: dto?.notes ?? null,
                approved_by_id: user.id,
            },
            select: DbDataConstant.campaignData,
        });
    }

    async findAllByStatus(status: CampaignStatus, options: PaginationOptions) {
        const settings = {
            defaultLimit: 10,
            maxLimit: 50,
        };

        return paginate(
            async () => {
                const [campaigns, total] = await this.prisma.$transaction([
                    this.prisma.campaign.findMany({
                        where: { status, is_deleted: false },
                        orderBy: { created_at: 'desc' },
                        skip: (options.page! - 1) * (options.limit ?? settings.defaultLimit),
                        take: options.limit ?? settings.defaultLimit,
                        select: DbDataConstant.campaignData,
                    }),
                    this.prisma.campaign.count({
                        where: { status, is_deleted: false },
                    }),
                ]);
                return [campaigns, total];
            },
            options,
            settings,
        );
    }

    async findAllByExtensionStatus(
        user: { id: string; role: UserRole },
        status: CampaignExtensionStatus,
        options: PaginationOptions,
    ) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view extension requests');
        }

        const settings = {
            defaultLimit: 10,
            maxLimit: 50,
        };

        const page = options.page ?? 1;
        const limit = options.limit ?? settings.defaultLimit;
        const skip = (page - 1) * limit;

        return paginate(
            async () => {
                const [campaigns, total] = await this.prisma.$transaction([
                    this.prisma.campaign.findMany({
                        where: {
                            extension_status: status,
                            is_deleted: false,
                        },
                        orderBy: { extension_requested_at: 'desc' },
                        skip,
                        take: limit,
                        select: DbDataConstant.campaignData,
                    }),
                    this.prisma.campaign.count({
                        where: {
                            extension_status: status,
                            is_deleted: false,
                        },
                    }),
                ]);
                return [campaigns, total];
            },
            options,
            settings,
        );
    }

    async requestExtension(
        user: { id: string; role: UserRole },
        campaignId: string,
        dto: RequestCampaignExtensionDto,
    ) {
        void campaignId;
        void dto;
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Campaign owners cannot extend campaigns. Only admins can extend campaigns.');
        }

        throw new BadRequestException('Use the admin extend endpoint to update a campaign deadline directly.');
    }

    async extendCampaign(
        user: { id: string; role: UserRole },
        campaignId: string,
        dto: ExtendCampaignDto,
    ) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can extend campaign deadlines');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaign) throw new NotFoundException();
        if (campaign.is_deleted) {
            throw new BadRequestException('Deleted campaigns cannot be extended');
        }

        const nextDeadline = new Date(dto.deadline);
        if (Number.isNaN(nextDeadline.getTime())) {
            throw new BadRequestException('Invalid campaign deadline');
        }

        const previousDeadline =
            campaign.deadline instanceof Date ? campaign.deadline : new Date(campaign.deadline as unknown as string);

        const updatedCampaign = await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                deadline: nextDeadline,
                extension_status: 'APPROVED',
                requested_deadline: null,
                extension_reviewed_at: new Date(),
            },
            select: DbDataConstant.campaignData,
        });

        await this.recordExtensionAudit(campaign.id, user.id, previousDeadline, nextDeadline);

        return updatedCampaign;
    }

    async reviewExtension(
        user: { id: string; role: UserRole },
        campaignId: string,
        dto: ReviewCampaignExtensionDto,
    ) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can review extension requests');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });

        if (!campaign) throw new NotFoundException();
        if (campaign.is_deleted) {
            throw new BadRequestException('Deleted campaigns cannot be reviewed');
        }

        const extensionStatus = campaign.extension_status;
        if (extensionStatus !== 'PENDING') {
            throw new ForbiddenException('No pending extension request to review');
        }

        const reviewedAt = new Date();
        if (dto.approve) {
            if (!campaign.requested_deadline) {
                throw new ForbiddenException('Requested deadline missing');
            }

            const requestedDeadline = campaign.requested_deadline;
            const previousDeadline =
                campaign.deadline instanceof Date ? campaign.deadline : new Date(campaign.deadline as unknown as string);

            const updatedCampaign = await this.prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    deadline: requestedDeadline,
                    extension_status: 'APPROVED',
                    extension_reviewed_at: reviewedAt,
                },
                select: DbDataConstant.campaignData,
            });

            await this.recordExtensionAudit(
                campaign.id,
                user.id,
                previousDeadline,
                requestedDeadline instanceof Date ? requestedDeadline : new Date(requestedDeadline as unknown as string),
            );

            return updatedCampaign;
        }

        return this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                extension_status: 'REJECTED',
                extension_reviewed_at: reviewedAt,
            },
            select: DbDataConstant.campaignData,
        });
    }

    async createSupportingDocumentRequest(user: { id: string; role: UserRole }, campaignId: string) {
        const campaign = await this.findCampaignRecord(campaignId);
        if (!campaign) throw new NotFoundException();
        if (campaign.is_deleted) {
            throw new BadRequestException('Deleted campaigns cannot receive document requests');
        }

        return this.prisma.supportingDocumentRequest.upsert({
            where: {
                user_id_campaign_id: {
                    user_id: user.id,
                    campaign_id: campaign.id,
                },
            },
            update: {
                requested_at: new Date(),
                status: 'PENDING',
                reviewed_at: null,
                reviewed_by_id: null,
            },
            create: {
                user_id: user.id,
                campaign_id: campaign.id,
                status: 'PENDING',
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        public_id: true,
                        title: true,
                    },
                },
            },
        });
    }

    async getSupportingDocumentRequestStatus(user: { id: string; role: UserRole }, campaignId: string) {
        const campaign = await this.findCampaignRecord(campaignId, {
            includeDeleted: user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN,
        });
        if (!campaign) throw new NotFoundException();

        return {
            data: await this.prisma.supportingDocumentRequest.findUnique({
                where: {
                    user_id_campaign_id: {
                        user_id: user.id,
                        campaign_id: campaign.id,
                    },
                },
            }),
        };
    }

    async listSupportingDocumentRequests(user: { id: string; role: UserRole }, campaignId: string) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can review supporting document requests');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaign) throw new NotFoundException();

        return {
            data: await this.prisma.supportingDocumentRequest.findMany({
                where: {
                    campaign_id: campaign.id,
                },
                orderBy: {
                    requested_at: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            philanthropic_name: true,
                            email: true,
                        },
                    },
                },
            }),
        };
    }

    async listAllSupportingDocumentRequests(
        user: { id: string; role: UserRole },
        options: PaginationOptions = {},
        search?: string,
    ) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can review supporting document requests');
        }

        const normalizedSearch = search?.trim();
        const where = normalizedSearch
            ? {
                OR: [
                    {
                        campaign: {
                            title: { contains: normalizedSearch, mode: 'insensitive' as const },
                        },
                    },
                    {
                        user: {
                            email: { contains: normalizedSearch, mode: 'insensitive' as const },
                        },
                    },
                    {
                        user: {
                            philanthropic_name: { contains: normalizedSearch, mode: 'insensitive' as const },
                        },
                    },
                ],
            }
            : {};

        return paginate(
            async (skip, limit) => {
                const [requests, total] = await this.prisma.$transaction([
                    this.prisma.supportingDocumentRequest.findMany({
                        where,
                        orderBy: { requested_at: 'desc' },
                        skip,
                        take: limit,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    philanthropic_name: true,
                                    email: true,
                                },
                            },
                            campaign: {
                                select: {
                                    id: true,
                                    public_id: true,
                                    title: true,
                                },
                            },
                            reviewed_by: {
                                select: {
                                    id: true,
                                    philanthropic_name: true,
                                    email: true,
                                },
                            },
                        },
                    }),
                    this.prisma.supportingDocumentRequest.count({ where }),
                ]);

                return [requests, total];
            },
            options,
            { defaultLimit: 20, maxLimit: 20 },
        );
    }

    async reviewSupportingDocumentRequest(
        user: { id: string; role: UserRole },
        requestId: string,
        approve: boolean,
    ) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can review supporting document requests');
        }

        const request = await this.prisma.supportingDocumentRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) throw new NotFoundException();

        return this.prisma.supportingDocumentRequest.update({
            where: { id: request.id },
            data: {
                status: approve ? 'APPROVED' : 'REJECTED',
                reviewed_at: new Date(),
                reviewed_by_id: user.id,
            },
        });
    }

    async getSupportingDocuments(user: { id: string; role: UserRole }, campaignId: string) {
        const campaign = await this.findCampaignRecord(campaignId, {
            includeDeleted: user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN,
        });
        if (!campaign) throw new NotFoundException();

        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        const isOwner = campaign.user_id === user.id;

        if (!isAdmin && !isOwner) {
            const request = await this.prisma.supportingDocumentRequest.findUnique({
                where: {
                    user_id_campaign_id: {
                        user_id: user.id,
                        campaign_id: campaign.id,
                    },
                },
            });

            if (!request || request.status !== 'APPROVED') {
                throw new ForbiddenException('Supporting documents are only available after admin approval');
            }
        }

        return {
            data: {
                certified_pdf: campaign.certified_pdf,
                records: campaign.records ?? [],
            },
        };
    }

    async listExtensionAudits(user: { id: string; role: UserRole }, campaignId: string) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view extension audit history');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaign) throw new NotFoundException();

        return {
            data: await this.prisma.campaignExtensionAudit.findMany({
                where: {
                    campaign_id: campaign.id,
                },
                orderBy: {
                    created_at: 'desc',
                },
                include: {
                    admin: {
                        select: {
                            id: true,
                            philanthropic_name: true,
                            email: true,
                        },
                    },
                },
            }),
        };
    }

    async verifyCampaign(campaignId: string, userId: string) {
        // 1. Get the user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // 2. Check if user is a "proxy"
        if (user.role !== UserRole.PROXY) {
            throw new Error('Only proxy users can verify campaigns');
        }

        // 3. Update the campaign
        const campaignRecord = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaignRecord) {
            throw new NotFoundException('Campaign not found');
        }

        const campaign = await this.prisma.campaign.update({
            where: { id: campaignRecord.id },
            data: {
                verified_by: {
                    connect: { id: user.id },
                },
            },
        });

        return campaign;
    }

    async restore(user: { id: string; role: UserRole }, campaignId: string) {
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can restore campaigns');
        }

        const campaign = await this.findCampaignRecord(campaignId, { includeDeleted: true });
        if (!campaign) throw new NotFoundException();
        if (!campaign.is_deleted) {
            throw new BadRequestException('Campaign is not deleted');
        }

        return this.prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                is_deleted: false,
                deleted_at: null,
                deleted_by_id: null,
            },
            select: DbDataConstant.campaignData,
        });
    }

    findOne(id: number) {
        return `This action returns a #${id} campaign`;
    }
}

import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SignUpDto } from 'src/services/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DbUser } from 'src/shared/types/db-user.types';
import { UpdateMarketingMetadataDto } from './dto/update-marketing-metadata.dto';
import { Prisma, USER_ROLES } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { paginate, PaginationOptions } from 'src/shared/utils/pagination/pagination';

@Injectable()
export class UserService implements OnModuleInit {
    constructor(private readonly prismaDB: PrismaService) { }

    async onModuleInit() {
        await this.ensureDefaultAdmin();
    }

    private async ensureDefaultAdmin() {
        const email = 'admin@torchlife.co';
        const existing = await this.prismaDB.user.findFirst({
            where: {
                email: {
                    equals: this.normalizeEmail(email),
                    mode: 'insensitive',
                },
            },
        });

        if (existing) return;

        const password = 'Admin123';
        const hashedPassword = await this.hashPassword(password);

        await this.prismaDB.user.create({
            data: {
                email: this.normalizeEmail(email),
                password: hashedPassword,
                first_name: 'Admin',
                last_name: 'TorchLife',
                philanthropic_name: 'TorchLifeAdmin',
                isverified: true,
                role: USER_ROLES.ADMIN,
                marketing_metadata: {
                    auth: {
                        provider: 'seed',
                        hasPassword: true,
                    },
                } as Prisma.InputJsonValue,
            },
        });
    }

    private isUuid(value: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    private sanitizeUser<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
        const { password, ...result } = user;
        return result;
    }

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private normalizePhone(phoneNumber?: string | null) {
        if (typeof phoneNumber !== 'string') return null;
        const trimmed = phoneNumber.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    private getAuthMetadata(user: { marketing_metadata?: unknown }) {
        const metadata =
            typeof user.marketing_metadata === 'object' &&
                user.marketing_metadata &&
                !Array.isArray(user.marketing_metadata)
                ? (user.marketing_metadata as Record<string, unknown>)
                : {};
        const auth =
            typeof metadata.auth === 'object' && metadata.auth ? (metadata.auth as Record<string, unknown>) : {};

        return { metadata, auth };
    }

    private isGuestDonorAccount(user: { marketing_metadata?: unknown }) {
        const { auth } = this.getAuthMetadata(user);
        return auth.provider === 'guest_donor';
    }

    private buildGuestDonorPhilanthropicName(email: string) {
        const emailPrefix = this.normalizeEmail(email).split('@')[0]?.replace(/[^a-z0-9]/gi, '').slice(0, 20) || 'donor';
        return `guest-${emailPrefix}-${Date.now().toString(36)}`;
    }

    async getUser(identifier: string): Promise<DbUser> {
        const trimmedIdentifier = identifier.trim();
        const filters: Prisma.UserWhereInput[] = [
            {
                email: {
                    equals: this.normalizeEmail(trimmedIdentifier),
                    mode: 'insensitive',
                },
            },
            { phone_number: trimmedIdentifier },
        ];

        if (this.isUuid(trimmedIdentifier)) {
            filters.push({ id: trimmedIdentifier });
        }

        const user = await this.prismaDB.user.findFirst({
            where: {
                OR: filters,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user as unknown as DbUser;
    }

    async getUserById(userId: string): Promise<DbUser> {
        const user = await this.prismaDB.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user as unknown as DbUser;
    }

    async findUserByEmail(email: string): Promise<DbUser | null> {
        const user = await this.prismaDB.user.findFirst({
            where: {
                email: {
                    equals: this.normalizeEmail(email),
                    mode: 'insensitive',
                },
            },
        });

        return (user as unknown as DbUser) ?? null;
    }

    async findOrCreateDonationUserByEmail(email: string): Promise<DbUser> {
        const normalizedEmail = this.normalizeEmail(email);
        const existingUser = await this.findUserByEmail(normalizedEmail);

        if (existingUser) {
            return existingUser;
        }

        const password = await this.hashPassword(`guest-donor-${normalizedEmail}-${Date.now()}`);
        const guestUser = await this.prismaDB.user.create({
            data: {
                email: normalizedEmail,
                password,
                first_name: 'Guest',
                last_name: 'Donor',
                philanthropic_name: this.buildGuestDonorPhilanthropicName(normalizedEmail),
                isverified: false,
                marketing_metadata: {
                    auth: {
                        provider: 'guest_donor',
                        hasPassword: false,
                        profileComplete: false,
                    },
                    guestDonor: {
                        createdFromDonation: true,
                    },
                } as Prisma.InputJsonValue,
            },
        });

        return guestUser as unknown as DbUser;
    }


    async verifiedEmail(id: string) {
        await this.prismaDB.user.update({
            where: { id },
            data: {
                isverified: true,
            },
        });
    }

    async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    // create user
    async createUser(user: SignUpDto): Promise<Omit<DbUser, 'password'>> {
        const normalizedEmail = this.normalizeEmail(user.email);
        const normalizedPhone = this.normalizePhone(user.phone_number);
        const hashedPassword = await this.hashPassword(user.password);
        const philanthropicName = user.philanthropic_name?.trim();
        const duplicateFilters: Prisma.UserWhereInput[] = [{ email: normalizedEmail }];

        if (normalizedPhone) {
            duplicateFilters.push({ phone_number: normalizedPhone });
        }

        if (philanthropicName) {
            duplicateFilters.push({ philanthropic_name: philanthropicName });
        }

        const existing = await this.prismaDB.user.findFirst({
            where: {
                OR: duplicateFilters,
            },
        });

        if (existing) {
            if (existing.email === normalizedEmail && this.isGuestDonorAccount(existing)) {
                const conflictingUser = await this.prismaDB.user.findFirst({
                    where: {
                        id: { not: existing.id },
                        OR: [
                            ...(normalizedPhone ? [{ phone_number: normalizedPhone }] : []),
                            ...(philanthropicName ? [{ philanthropic_name: philanthropicName }] : []),
                        ],
                    },
                });

                if (conflictingUser) {
                    if (normalizedPhone && conflictingUser.phone_number === normalizedPhone) {
                        throw new ConflictException('Phone number already exists');
                    }

                    if (
                        philanthropicName &&
                        (conflictingUser as unknown as { philanthropic_name?: string | null }).philanthropic_name === philanthropicName
                    ) {
                        throw new ConflictException('Philanthropic name already taken');
                    }
                }

                const { metadata } = this.getAuthMetadata(existing);
                const updatedGuestUser = await this.prismaDB.user.update({
                    where: { id: existing.id },
                    data: {
                        password: hashedPassword,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        philanthropic_name: philanthropicName,
                        phone_number: normalizedPhone,
                        isverified: false,
                        marketing_metadata: {
                            ...metadata,
                            auth: {
                                provider: 'password',
                                hasPassword: true,
                                upgradedFromGuestDonor: true,
                            },
                            guestDonor: {
                                upgradedAt: new Date().toISOString(),
                            },
                        } as Prisma.InputJsonValue,
                    },
                });

                return this.sanitizeUser(updatedGuestUser) as unknown as Omit<DbUser, 'password'>;
            }

            if (existing.email === normalizedEmail) {
                throw new ConflictException('Email already exists');
            }

            if (normalizedPhone && existing.phone_number === normalizedPhone) {
                throw new ConflictException('Phone number already exists');
            }

            if (philanthropicName && (existing as unknown as { philanthropic_name?: string | null }).philanthropic_name === philanthropicName) {
                throw new ConflictException('Philanthropic name already taken');
            }

            throw new ConflictException('Email or phone number already exists');
        }

        const newUser = await this.prismaDB.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                first_name: user.first_name,
                last_name: user.last_name,
                philanthropic_name: philanthropicName,
                phone_number: normalizedPhone,
                isverified: false,
                marketing_metadata: {
                    auth: {
                        provider: 'password',
                        hasPassword: true,
                    },
                } as Prisma.InputJsonValue,
            },
        });
        return this.sanitizeUser(newUser) as unknown as Omit<DbUser, 'password'>;
    }

    async createGoogleUser(data: {
        email: string;
        firstName: string;
        lastName: string;
        googleId: string;
        picture?: string;
    }): Promise<Omit<DbUser, 'password'>> {
        const password = await this.hashPassword(`google_${data.googleId}_${Date.now()}`);
        const philanthropicName = `${data.firstName} ${data.lastName}`.trim();

        const newUser = await this.prismaDB.user.create({
            data: {
                email: this.normalizeEmail(data.email),
                password,
                first_name: data.firstName,
                last_name: data.lastName,
                philanthropic_name: philanthropicName,
                isverified: true,
                marketing_metadata: {
                    auth: {
                        provider: 'google',
                        googleId: data.googleId,
                        picture: data.picture ?? null,
                        hasPassword: false,
                    },
                } as Prisma.InputJsonValue,
            },
        });

        return this.sanitizeUser(newUser) as unknown as Omit<DbUser, 'password'>;
    }

    async upsertGoogleMetadata(userId: string, data: { googleId: string; picture?: string }) {
        const user = await this.getUserById(userId);
        const { metadata, auth } = this.getAuthMetadata(user);

        return this.prismaDB.user.update({
            where: { id: userId },
            data: {
                isverified: true,
                marketing_metadata: {
                    ...metadata,
                    auth: {
                        ...auth,
                        provider: 'google',
                        googleId: data.googleId,
                        picture: data.picture ?? null,
                        hasPassword: auth.hasPassword !== false,
                    },
                } as Prisma.InputJsonValue,
            },
        });
    }

    async setPasswordByUserId(userId: string, password: string): Promise<Omit<DbUser, 'password'>> {
        const user = await this.getUserById(userId);
        const { metadata, auth } = this.getAuthMetadata(user);
        const hashedPassword = await this.hashPassword(password);

        const updatedUser = await this.prismaDB.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                marketing_metadata: {
                    ...metadata,
                    auth: {
                        ...auth,
                        hasPassword: true,
                    },
                } as Prisma.InputJsonValue,
            },
        });

        return this.sanitizeUser(updatedUser) as unknown as Omit<DbUser, 'password'>;
    }

    hasPassword(user: DbUser): boolean {
        const { auth } = this.getAuthMetadata(user);
        return auth.hasPassword !== false;
    }

    //Update password
    async updatePassword(identifier: string, password: string): Promise<Omit<DbUser, 'password'>> {
        const user = await this.getUser(identifier);
        const { metadata, auth } = this.getAuthMetadata(user);
        const hashedPassword = await this.hashPassword(password);

        const updatedUser = await this.prismaDB.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                marketing_metadata: {
                    ...metadata,
                    auth: {
                        ...auth,
                        hasPassword: true,
                    },
                } as Prisma.InputJsonValue,
            },
        });

        return this.sanitizeUser(updatedUser) as unknown as Omit<DbUser, 'password'>;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<DbUser, 'password'>> {
        const user = await this.getUserById(userId);
        const normalizedPhone = this.normalizePhone(dto.phone_number);
        const nextFirstName = typeof dto.first_name === 'string' ? dto.first_name.trim() : undefined;
        const nextLastName = typeof dto.last_name === 'string' ? dto.last_name.trim() : undefined;
        const nextPhilanthropicName =
            typeof dto.philanthropic_name === 'string' ? dto.philanthropic_name.trim() : undefined;

        try {
            const updated = await this.prismaDB.user.update({
                where: { id: user.id },
                data: {
                    first_name: nextFirstName ?? undefined,
                    last_name: nextLastName ?? undefined,
                    philanthropic_name: nextPhilanthropicName ?? undefined,
                    phone_number: normalizedPhone ?? undefined,
                },
            });

            return this.sanitizeUser(updated) as unknown as Omit<DbUser, 'password'>;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const target = (error.meta as { target?: unknown } | undefined)?.target;
                const targetFields = Array.isArray(target) ? target.map(String) : [];
                if (targetFields.includes('philanthropic_name')) {
                    throw new ConflictException('Philanthropic name already taken');
                }
                if (targetFields.includes('phone_number')) {
                    throw new ConflictException('Phone number already exists');
                }
                throw new ConflictException('Unique constraint violation');
            }
            throw error;
        }
    }

    // delete user
    async deleteUser(id: string): Promise<Omit<DbUser, 'password'>> {
        const deletedUser = await this.prismaDB.user.delete({
            where: {
                id: id,
            },
        });
        return this.sanitizeUser(deletedUser) as unknown as Omit<DbUser, 'password'>;
    }

    // get all users
    async getAllUsers(): Promise<Array<Omit<DbUser, 'password'>>> {
        const users = await this.prismaDB.user.findMany();
        return users.map((user) => this.sanitizeUser(user) as unknown as Omit<DbUser, 'password'>);
    }

    async getAdminUsers(
        user: { id: string; role: USER_ROLES },
        options: PaginationOptions = {},
        search?: string,
    ) {
        if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view platform users');
        }

        const normalizedSearch = search?.trim();
        const where = normalizedSearch
            ? {
                OR: [
                    { first_name: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { last_name: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { email: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { phone_number: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    { philanthropic_name: { contains: normalizedSearch, mode: 'insensitive' as const } },
                ],
            }
            : {};

        return paginate(
            async (skip, limit) => {
                const [users, total] = await this.prismaDB.$transaction([
                    this.prismaDB.user.findMany({
                        where,
                        orderBy: { created_at: 'desc' },
                        skip,
                        take: limit,
                        include: {
                            donations: {
                                where: { status: 'SUCCESS' },
                                select: { id: true },
                            },
                            campaigns: {
                                where: { is_deleted: false },
                                select: { id: true },
                            },
                        },
                    }),
                    this.prismaDB.user.count({ where }),
                ]);

                return [
                    users.map((listedUser) => ({
                        id: listedUser.id,
                        first_name: listedUser.first_name,
                        last_name: listedUser.last_name,
                        email: listedUser.email,
                        phone_number: listedUser.phone_number,
                        avatar_url: null,
                        role: listedUser.role,
                        created_at: listedUser.created_at,
                        philanthropic_name: listedUser.philanthropic_name,
                        impact_score: listedUser.impact_score,
                        donationCount: listedUser.donations.length,
                        campaignCount: listedUser.campaigns.length,
                    })),
                    total,
                ];
            },
            options,
            { defaultLimit: 20, maxLimit: 20 },
        );
    }

    async getAdminMetrics(user: { id: string; role: USER_ROLES }) {
        if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
            throw new ForbiddenException('Only admins can view platform metrics');
        }

        const [
            totalUsers,
            totalCampaigns,
            approvedCampaigns,
            pendingCampaigns,
            rejectedCampaigns,
            expiredCampaigns,
            totalDonations,
            documentRequests,
            proxyAccounts,
        ] = await this.prismaDB.$transaction([
            this.prismaDB.user.count(),
            this.prismaDB.campaign.count({ where: { is_deleted: false } }),
            this.prismaDB.campaign.count({ where: { is_deleted: false, status: 'APPROVED' } }),
            this.prismaDB.campaign.count({ where: { is_deleted: false, status: 'PENDING' } }),
            this.prismaDB.campaign.count({ where: { is_deleted: false, status: 'REJECTED' } }),
            this.prismaDB.campaign.count({
                where: {
                    is_deleted: false,
                    deadline: { lt: new Date() },
                },
            }),
            this.prismaDB.donation.count({ where: { status: 'SUCCESS' } }),
            this.prismaDB.supportingDocumentRequest.count(),
            this.prismaDB.user.count({ where: { role: 'PROXY' } }),
        ]);

        return {
            data: {
                totalUsers,
                totalCampaigns,
                approvedCampaigns,
                pendingCampaigns,
                rejectedCampaigns,
                expiredCampaigns,
                totalDonations,
                documentRequests,
                proxyAccounts,
            },
        };
    }

    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(password, salt);
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
        await this.prismaDB.user.update({
            where: { id: userId },
            data: { refreshToken },
        });
    }

    async updateMarketingMetadata(
        userId: string,
        dto: UpdateMarketingMetadataDto,
        cookies: Record<string, string>,
    ) {
        const user = await this.prismaDB.user.findUnique({
            where: { id: userId },
            include: {
                donations: {
                    where: { status: 'SUCCESS' },
                    select: {
                        amount: true,
                        campaign_id: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const successfulDonationCount = user.donations.length;
        const paidCampaignCount = new Set(user.donations.map((donation) => donation.campaign_id)).size;
        const totalDonatedAmount = user.donations.reduce((sum, donation) => sum + donation.amount, 0);

        const mergedMarketingMetadata = {
            ...(typeof user.marketing_metadata === 'object' && user.marketing_metadata ? user.marketing_metadata : {}),
            campaignInterest: dto.campaignInterest ?? [],
            campaignCategories: dto.campaignCategories ?? [],
            recentlyViewedCampaignIds: dto.recentlyViewedCampaignIds ?? [],
            source: dto.source ?? null,
            referrer: dto.referrer ?? null,
            cookieMetadata: {
                ...(cookies ?? {}),
                ...(dto.cookieMetadata ?? {}),
            },
            derived: {
                successfulDonationCount,
                paidCampaignCount,
                totalDonatedAmount,
            },
        };

        const normalizedMarketingMetadata = JSON.parse(
            JSON.stringify(mergedMarketingMetadata),
        ) as Prisma.InputJsonValue;

        return this.prismaDB.user.update({
            where: { id: userId },
            data: {
                marketing_metadata: normalizedMarketingMetadata,
                last_marketing_sync_at: new Date(),
            },
            select: {
                id: true,
                email: true,
                marketing_metadata: true,
                last_marketing_sync_at: true,
            },
        });
    }
}

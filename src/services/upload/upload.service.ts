// src/upload/upload.service.ts

import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 as Cloudinary } from 'cloudinary';

import { CLOUDINARY } from './providers/cloudinary.provider';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UploadService {
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

    private readonly allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    constructor(
        @Inject(CLOUDINARY)
        private readonly cloudinary: typeof Cloudinary,

        private readonly prismaDB: PrismaService,
    ) { }

    async uploadFile(
        file: Express.Multer.File,
        campaignId: string,
        userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!campaignId) {
            throw new BadRequestException('Campaign ID is required');
        }

        if (!userId) {
            throw new BadRequestException('User authentication required');
        }

        const campaign = await this.prismaDB.campaign.findFirst({
            where: {
                id: campaignId,
                is_deleted: false,
            },
            select: { id: true },
        });

        if (!campaign) {
            throw new BadRequestException('Campaign not found or has been removed');
        }

        const isAllowedMimeType = this.allowedMimeTypes.includes(file.mimetype);

        if (!isAllowedMimeType) {
            throw new BadRequestException(
                'Only JPG, PNG, WEBP, and PDF files are allowed',
            );
        }

        if (file.size > this.MAX_FILE_SIZE) {
            throw new BadRequestException(
                'File size cannot exceed 10MB',
            );
        }

        let uploadResult: UploadApiResponse;

        try {
            uploadResult = await new Promise<UploadApiResponse>(
                (resolve, reject) => {
                    this.cloudinary.uploader.upload_stream(
                        {
                            folder: `torchlife/campaigns/${campaignId}`,
                            resource_type: 'auto',
                            overwrite: false,
                        },
                        (error, result) => {
                            if (error) {
                                return reject(error);
                            }

                            if (!result) {
                                return reject(new Error('No upload result returned'));
                            }

                            resolve(result);
                        },
                    ).end(file.buffer);
                },
            );
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to upload file',
            );
        }

        return this.prismaDB.fileUpload.create({
            data: {
                publicId: uploadResult.public_id,
                url: uploadResult.secure_url,
                format: uploadResult.format,
                resourceType: uploadResult.resource_type,
                sizeInBytes: uploadResult.bytes,
                originalName: file.originalname,
                mimeType: file.mimetype,
                userId,
                campaignId,
            },
        });
    }
}

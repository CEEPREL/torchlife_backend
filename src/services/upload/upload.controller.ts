import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UploadService } from 'src/services/upload/upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';

import {
  ApiStandardResponse,
  ApiCommonErrors,
} from 'src/shared/decorators/swagger.decorator';

class FileUploadResponseDto { }

@ApiTags('Uploads')
@ApiCommonErrors()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post()
  @ApiOperation({
    summary: 'Create upload record',
    description: 'Internal endpoint for creating metadata records for uploaded files.',
  })
  @ApiStandardResponse(FileUploadResponseDto, 201, 'Upload record created')
  create(@Body() createUploadDto: CreateUploadDto) {
    return { message: 'Upload endpoint is under construction' };
  }

  @Get()
  @ApiOperation({
    summary: 'List uploads',
    description: 'Retrieves a list of all file upload records.',
  })
  @ApiStandardResponse(FileUploadResponseDto, 200, 'Uploads retrieved')
  findAll() {
    return { message: 'Upload endpoint is under construction' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get upload details',
    description: 'Retrieves metadata for a specific file upload by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the upload record',
  })
  @ApiStandardResponse(FileUploadResponseDto, 200, 'Upload found')
  findOne(@Param('id') id: string) { }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update upload metadata',
    description: 'Allows updating the description or visibility of an uploaded file.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the upload to update',
  })
  @ApiStandardResponse(FileUploadResponseDto, 200, 'Upload updated')
  update(
    @Param('id') id: string,
    @Body() updateUploadDto: UpdateUploadDto,
  ) {
    return { message: 'Upload endpoint is under construction' };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete upload',
    description: 'Removes the file metadata and associated storage reference.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the upload to delete',
  })
  @ApiStandardResponse(FileUploadResponseDto, 200, 'Upload deleted')
  remove(@Param('id') id: string) {
    return { message: 'Upload endpoint is under construction' };
  }

  @Post('campaign/:campaignId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Upload campaign document',
    description:
      'Uploads a file (image, PDF) to Cloudinary and associates it with a campaign.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiParam({
    name: 'campaignId',
    description: 'The ID of the campaign this file belongs to',
  })
  @ApiStandardResponse(
    FileUploadResponseDto,
    201,
    'File uploaded successfully',
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('campaignId') campaignId: string,
    @Req() req,
  ) {
    const userId = req.user?.id;
    return this.uploadService.uploadFile(file, campaignId, userId).then((uploaded) => ({
      data: {
        id: uploaded.id,
        url: uploaded.url,
        publicId: uploaded.publicId,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
      },
    }));
  }
}

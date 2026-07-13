import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginationOptionsDto } from 'src/shared/utils/pagination/pagination-options.dto';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user';
import { CampaignStatus } from 'src/domain/enums/campaign-status.enum';
import { ApiStandardResponse, ApiCommonErrors } from 'src/shared/decorators/swagger.decorator';
import { RequestCampaignExtensionDto } from './dto/request-extension.dto';
import { ReviewCampaignExtensionDto } from './dto/review-extension.dto';
import type { CampaignExtensionStatus } from './campaign.service';
import { ReviewCampaignDto } from './dto/review-campaign.dto';
import { ExtendCampaignDto } from './dto/extend-campaign.dto';
import { ReviewDocumentRequestDto } from './dto/review-document-request.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

class CampaignResponseDto {
  // Define properties if needed for swagger response
}

@ApiTags('Campaigns')
@ApiCommonErrors()
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) { }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('create-user')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'image_url', maxCount: 1 },
        { name: 'certified_pdf', maxCount: 1 },
        { name: 'records', maxCount: 10 },
        { name: 'record', maxCount: 10 },
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['USER', 'PROXY'] },
        title: { type: 'string' },
        story: { type: 'string' },
        deadline: { type: 'string', format: 'date-time' },
        target_amount: { type: 'integer', minimum: 1 },
        targetAmount: { type: 'integer', minimum: 1 },
        location: { type: 'string' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        currency: { type: 'string', enum: ['NGN', 'USD'] },
        records: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string', format: 'binary' },
          ],
        },
        record: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string', format: 'binary' },
          ],
        },
        image: { type: 'string', format: 'binary' },
        image_url: {
          oneOf: [{ type: 'string' }, { type: 'string', format: 'binary' }],
        },
        imageUrl: { type: 'string' },
        certified_pdf: {
          oneOf: [{ type: 'string' }, { type: 'string', format: 'binary' }],
        },
        certifiedPdf: { type: 'string' },
        proxyName: { type: 'string' },
        proxyPhone: { type: 'string' },
        proxyEmail: { type: 'string' },
      },
      required: ['type', 'title', 'story', 'deadline', 'target_amount'],
    },
  })
  @ApiOperation({
    summary: 'Create a new campaign',
    description: 'Allows an authenticated user to create a crowdfunding campaign for themselves or a beneficiary. Supports direct file upload to Cloudinary or pre-hosted URLs.',
  })
  @ApiStandardResponse(CampaignResponseDto, 201, 'Campaign successfully created')
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCampaignDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      image_url?: Express.Multer.File[];
      certified_pdf?: Express.Multer.File[];
      records?: Express.Multer.File[];
      record?: Express.Multer.File[];
    },
  ) {
    const userId = user.id;
    return this.campaignService.create(userId, dto, files);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('user')
  @ApiOperation({
    summary: 'Get user campaigns',
    description: 'Retrieves all campaigns created by the currently authenticated user with pagination support.',
  })
  @ApiStandardResponse(CampaignResponseDto, 200, 'List of user campaigns')
  async findAllByUser(@CurrentUser() user: AuthUser, @Query() options: PaginationOptionsDto) {
    const userId = user.id;
    return this.campaignService.findAllByUser(userId, options);
  }

  @Get('public/:publicId')
  @ApiOperation({
    summary: 'Get public campaign details',
    description: 'Retrieves the public detail view of an approved campaign by its public identifier or internal UUID.',
  })
  @ApiParam({ name: 'publicId', description: 'The public identifier or internal UUID of the campaign' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign found')
  async findPublicCampaign(@Param('publicId') publicId: string) {
    return this.campaignService.findPublicByPublicId(publicId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get authenticated campaign details',
    description: 'Retrieves full details of a single campaign for its owner or an administrative user.',
  })
  @ApiParam({ name: 'id', description: 'The unique identifier or public identifier of the campaign' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign found')
  async findOneById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.findOneForViewer({ id: user.id, role: user.role }, id);
  }

  @Get('status/:status')
  @ApiOperation({
    summary: 'Filter campaigns by status',
    description: 'Retrieves a paginated list of campaigns filtered by their current verification or publication status.',
  })
  @ApiParam({ name: 'status', enum: CampaignStatus, description: 'The status to filter campaigns by' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'List of campaigns by status')
  async findAllByStatus(@Param('status') status: CampaignStatus, @Query() options: PaginationOptionsDto) {
    return this.campaignService.findAllByStatus(status, options);
  }

  @Get()
  @ApiOperation({
    summary: 'List all campaigns',
    description: 'Retrieves a list of all campaigns. Access restricted to administrative users.',
  })
  @ApiStandardResponse(CampaignResponseDto, 200, 'All campaigns retrieved')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: AuthUser, @Query() options: PaginationOptionsDto, @Query('search') search?: string) {
    return this.campaignService.findAllAdmin({ id: user.id, role: user.role }, options, search);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('extension-status/:status')
  @ApiOperation({
    summary: 'Filter campaigns by extension status',
    description:
      'Admin-only endpoint for listing campaigns with a specific extension request status (e.g. PENDING).',
  })
  @ApiParam({
    name: 'status',
    enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
    description: 'The extension status to filter campaigns by',
  })
  @ApiStandardResponse(CampaignResponseDto, 200, 'List of campaigns by extension status')
  async findAllByExtensionStatus(
    @CurrentUser() user: AuthUser,
    @Param('status') status: CampaignExtensionStatus,
    @Query() options: PaginationOptionsDto,
  ) {
    return this.campaignService.findAllByExtensionStatus({ id: user.id, role: user.role }, status, options);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update campaign',
    description: 'Allows a campaign owner or an admin to update specific fields of an existing campaign by UUID or public identifier.',
  })
  @ApiParam({ name: 'id', description: 'The UUID or public identifier of the campaign to update' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign successfully updated')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.campaignService.update({ id: user.id, role: user.role }, id, updateCampaignDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete campaign',
    description: 'Soft deletes a campaign by UUID or public identifier. Restricted to owners and administrators.',
  })
  @ApiParam({ name: 'id', description: 'The UUID or public identifier of the campaign to delete' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign successfully deleted')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.remove({ id: user.id, role: user.role }, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore campaign',
    description: 'Admin-only endpoint to restore a previously soft-deleted campaign by UUID or public identifier.',
  })
  @ApiParam({ name: 'id', description: 'The UUID or public identifier of the campaign to restore' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign successfully restored')
  restore(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.restore({ id: user.id, role: user.role }, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve campaign',
    description: 'Allows an administrative user to approve a campaign by UUID or public identifier and send the campaign approval email.',
  })
  @ApiParam({ name: 'id', description: 'The UUID or public identifier of the campaign to approve' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign successfully approved')
  approveCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewCampaignDto) {
    return this.campaignService.approveCampaign({ id: user.id, role: user.role }, id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject campaign',
    description: 'Allows an administrative user to reject a pending campaign by UUID or public identifier and store moderation notes.',
  })
  rejectCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewCampaignDto) {
    return this.campaignService.rejectCampaign({ id: user.id, role: user.role }, id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post(':id/verify')
  @ApiOperation({
    summary: 'Verify campaign',
    description: 'Internal endpoint for proxy/admin users to mark a campaign as verified after document review using UUID or public identifier.',
  })
  @ApiParam({ name: 'id', description: 'The UUID or public identifier of the campaign to verify' })
  @ApiStandardResponse(CampaignResponseDto, 200, 'Campaign successfully verified')
  verifyCampaign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.verifyCampaign(id, user.id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/request-extension')
  @ApiOperation({
    summary: 'Request campaign deadline extension',
    description: 'Allows a campaign owner to request a new deadline for an expired campaign by UUID or public identifier. Requires admin approval.',
  })
  requestExtension(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RequestCampaignExtensionDto,
  ) {
    return this.campaignService.requestExtension({ id: user.id, role: user.role }, id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/extend')
  @ApiOperation({
    summary: 'Extend campaign deadline',
    description: 'Admin-only endpoint to directly update a campaign deadline from the detail page by UUID or public identifier.',
  })
  extendCampaign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ExtendCampaignDto,
  ) {
    return this.campaignService.extendCampaign({ id: user.id, role: user.role }, id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/review-extension')
  @ApiOperation({
    summary: 'Approve or reject campaign extension request',
    description: 'Admin-only endpoint to approve or reject a pending extension request by UUID or public identifier.',
  })
  reviewExtension(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewCampaignExtensionDto,
  ) {
    return this.campaignService.reviewExtension({ id: user.id, role: user.role }, id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('document-requests/admin')
  @ApiOperation({
    summary: 'List all supporting document requests',
    description: 'Admin-only endpoint returning a paginated list of supporting document requests across campaigns.',
  })
  listAllSupportingDocumentRequests(
    @CurrentUser() user: AuthUser,
    @Query() options: PaginationOptionsDto,
    @Query('search') search?: string,
  ) {
    return this.campaignService.listAllSupportingDocumentRequests(
      { id: user.id, role: user.role },
      options,
      search,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post(':id/document-requests')
  @ApiOperation({
    summary: 'Request supporting documents',
    description: 'Creates or refreshes a supporting document access request for the authenticated user.',
  })
  requestSupportingDocuments(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.createSupportingDocumentRequest({ id: user.id, role: user.role }, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id/document-requests/me')
  @ApiOperation({
    summary: 'Get my supporting document request status',
    description: 'Returns the authenticated user document-request status for a specific campaign.',
  })
  getMySupportingDocumentRequest(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.getSupportingDocumentRequestStatus({ id: user.id, role: user.role }, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id/document-requests')
  @ApiOperation({
    summary: 'List supporting document requests',
    description: 'Admin-only endpoint for reviewing supporting document requests for a campaign.',
  })
  listSupportingDocumentRequests(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.listSupportingDocumentRequests({ id: user.id, role: user.role }, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('document-requests/:requestId')
  @ApiOperation({
    summary: 'Review supporting document request',
    description: 'Admin-only endpoint to approve or reject a supporting document request.',
  })
  reviewSupportingDocumentRequest(
    @CurrentUser() user: AuthUser,
    @Param('requestId') requestId: string,
    @Body() dto: ReviewDocumentRequestDto,
  ) {
    return this.campaignService.reviewSupportingDocumentRequest(
      { id: user.id, role: user.role },
      requestId,
      dto.approve,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id/supporting-documents')
  @ApiOperation({
    summary: 'Download supporting documents metadata',
    description: 'Returns supporting document URLs for owners, admins, or users with approved document requests.',
  })
  getSupportingDocuments(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.getSupportingDocuments({ id: user.id, role: user.role }, id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id/extension-audits')
  @ApiOperation({
    summary: 'List extension audit history',
    description: 'Admin-only endpoint that returns campaign extension audit entries.',
  })
  listExtensionAudits(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.campaignService.listExtensionAudits({ id: user.id, role: user.role }, id);
  }
}

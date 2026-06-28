import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { Request } from 'express';
import { UpdateMarketingMetadataDto } from './dto/update-marketing-metadata.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationOptionsDto } from 'src/shared/utils/pagination/pagination-options.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    @ApiOperation({
        summary: 'Update current user profile',
        description: 'Updates name, phone number, and philanthropic name for the authenticated user. Email remains locked.',
    })
    updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
        return this.userService.updateProfile(user.id, dto);
    }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Post('marketing/metadata')
    @ApiOperation({
        summary: 'Store user marketing metadata',
        description:
            'Stores campaign interests, client cookie metadata, and derived donation statistics for the authenticated user.',
    })
    updateMarketingMetadata(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateMarketingMetadataDto,
        @Req() req: Request,
    ) {
        return this.userService.updateMarketingMetadata(user.id, dto, req.cookies ?? {});
    }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Get('admin/directory')
    @ApiOperation({
        summary: 'List users for admin review',
        description: 'Returns a paginated directory of users for admin dashboards with donation and campaign counts.',
    })
    getAdminDirectory(
        @CurrentUser() user: AuthUser,
        @Query() options: PaginationOptionsDto,
        @Query('search') search?: string,
    ) {
        return this.userService.getAdminUsers({ id: user.id, role: user.role }, options, search);
    }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Get('admin/metrics')
    @ApiOperation({
        summary: 'Get admin platform metrics',
        description: 'Returns platform-wide counts used in the admin dashboard metrics cards.',
    })
    getAdminMetrics(@CurrentUser() user: AuthUser) {
        return this.userService.getAdminMetrics({ id: user.id, role: user.role });
    }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user';
import { AuthUser } from 'src/shared/types/token-payload.types';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Get('balance')
    @ApiOperation({
        summary: 'Get current wallet balance',
        description: 'Returns the authenticated user wallet balance and currency.',
    })
    getBalance(@CurrentUser() user: AuthUser) {
        return this.walletService.getBalance(user.id);
    }

    @Post()
    create(@Body() createWalletDto: CreateWalletDto) {
        // return this.walletService.create(createWalletDto);
    }

    @Get()
    findAll() {
        // return this.walletService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        // return this.walletService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
        // return this.walletService.update(+id, updateWalletDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.walletService.remove(+id);
    }
}

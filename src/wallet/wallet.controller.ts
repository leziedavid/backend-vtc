import { Controller, Post, Body, Req, UseGuards, Get, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateWalletDto } from 'src/common/dto/request/wallet.dto';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('🚗 Wallet API')
@Controller('wallet')
@ApiBearerAuth('access-token')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    /** 💰 Endpoint pour recharger le wallet */
    @UseGuards(JwtAuthGuard)
    @Post('recharge')
    @ApiOperation({ summary: 'Recharge du portefeuille' })
    @ApiResponse({ status: 200, description: 'Recharge effectuée avec succès.' })
    @ApiResponse({ status: 400, description: 'Montant invalide.' })
    @ApiResponse({ status: 401, description: 'Aucun token JWT fourni.' })
    @ApiResponse({ status: 404, description: 'Wallet non trouvé.' })
    async rechargeWallet( @Req() req: Request, @Body() dto: CreateWalletDto, ): Promise<BaseResponse<null>> {
        const user = req.user as any; // Adapté selon ton AuthGuard
        console.log('Recharge Wallet - User ID:', user);
        return this.walletService.rechargeWallet(dto, user.id);
    }


    /** 💳 Récupération du portefeuille utilisateur */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Récupération du portefeuille utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Portefeuille récupéré avec succès.' })
    @ApiResponse({ status: 404, description: 'Portefeuille introuvable.' })
    async getUserWallet(@Req() req: Request) {
        const user = req.user as any;
        return this.walletService.getUserWallet(user.id);
    }

    /** 💸 Liste paginée des transactions utilisateur */
    @UseGuards(JwtAuthGuard)
    @Get('all/transactions')
    @ApiOperation({ summary: 'Liste paginée des transactions utilisateur' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste paginée des transactions.' })
    async getUserTransactions(
        @Req() req: Request,
        @Query() params: PaginationParamsDto,
    ) {
        const user = req.user as any;
        return this.walletService.getUserTransactionsPaginated(user.id, params);
    }
}

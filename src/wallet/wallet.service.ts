import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { PaymentMethod, TransactionType } from '@prisma/client';
import { CreateWalletDto } from 'src/common/dto/request/wallet.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class WalletService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,

    ) { }

    /** 💰 Recharge du portefeuille */
    async rechargeWallet(dto: CreateWalletDto, userId: string): Promise<BaseResponse<null>> {
        const { amount, paymentMethod, rechargeType } = dto;

        if (!amount || amount <= 0) {
            throw new BadRequestException('Le montant doit être supérieur à 0.');
        }

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet non trouvé.');

        try {
            // Mise à jour du solde
            await this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount }, paymentMethod, rechargeType },
            });

            // Création de la transaction avec montant décimal
            await this.prisma.transaction.create({
                data: {
                    amount: amount, // Float pris en charge
                    type: TransactionType.DEPOSIT,
                    walletId: wallet.id,
                    userId,
                    description: `Recharge via ${rechargeType ?? 'WAVE'} (${paymentMethod ?? PaymentMethod.MOBILE_MONEY})`,
                },
            });

            return new BaseResponse(200, 'Recharge effectuée avec succès', null);
        } catch (error) {
            console.error('Erreur lors de la recharge du wallet:', error);
            throw new InternalServerErrorException('Erreur lors de la recharge du wallet');
        }
    }

    /** 💳 Récupération du portefeuille utilisateur */
    async getUserWallet(userId: string): Promise<BaseResponse<any>> {
        try {
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId },
            });

            if (!wallet) throw new NotFoundException('Portefeuille introuvable.');

            return new BaseResponse(200, 'Portefeuille récupéré avec succès', wallet);
        } catch (error) {
            console.error('[WalletService.getUserWallet] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération du portefeuille');
        }
    }


    /** 💸 Transactions paginées d’un utilisateur */
    async getUserTransactionsPaginated(userId: string, params: PaginationParamsDto,): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Transaction',
                page: params.page,
                limit: params.limit,
                conditions: { userId }, // ✅ conforme à ton service
                orderBy: { createdAt: 'desc' },
                selectAndInclude: {
                    select: null,
                    include: {
                        wallet: true, // Inclut le portefeuille lié à chaque transaction
                    },
                },
            });

            return new BaseResponse(200, 'Liste paginée des transactions', data);
        } catch (error) {
            console.error('[WalletService.getUserTransactionsPaginated] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des transactions');
        }
    }


    

}

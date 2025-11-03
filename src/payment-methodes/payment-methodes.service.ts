import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { Status } from '@prisma/client';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreatePaymentMethodesDto, UpdatePaymentMethodesDto } from 'src/common/dto/request/payment-methodes.dto';

@Injectable()
export class PaymentMethodesService {
    constructor(
        private prisma: PrismaService,
        private functionService: FunctionService,
        private localStorage: LocalStorageService,
    ) { }

    async create(dto: CreatePaymentMethodesDto): Promise<BaseResponse<{ paymentMethodId: string }>> {
        const { logo, ...data } = dto as any;
        try {
            const method = await this.prisma.paymentMethodes.create({
                data,
            });

            // Upload du logo
            if (logo) {
                const uploadResult = await this.localStorage.saveFile(logo.buffer, 'payment-methodes');
                await this.prisma.paymentMethodes.update({
                    where: { id: method.id },
                    data: { logo: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(201, 'Méthode de paiement créée avec succès', { paymentMethodId: method.id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la création de la méthode de paiement');
        }
    }

    async getAll(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const data = await this.functionService.paginate<PaginateOptions>({
            model: 'PaymentMethodes',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: { select: null, include: null },
            orderBy: { createdAt: 'desc' },
        });

        data.data = data.data.map(method => ({
            ...method,
            logo: method.logo ? getPublicFileUrl(method.logo) : null,
        }));

        return new BaseResponse(200, 'Liste paginée des méthodes de paiement', data);
    }


    async getAllHome(): Promise<BaseResponse<any>> {
        // On retourne uniquement les méthodes actives pour la page d'accueil
        const methods = await this.prisma.paymentMethodes.findMany({
            where: { status: Status.ACTIVE },
            orderBy: { createdAt: 'desc' },
        });

        const data = methods.map(m => ({
            ...m,
            logo: m.logo ? getPublicFileUrl(m.logo) : null,
        }));

        return new BaseResponse(200, 'Liste des méthodes de paiement pour la page d’accueil', data);
    }

    async getOne(id: string) {
        const method = await this.prisma.paymentMethodes.findUnique({ where: { id } });
        if (!method) throw new NotFoundException('Méthode de paiement non trouvée');

        return new BaseResponse(200, 'Méthode de paiement récupérée', {
            ...method,
            logo: method.logo ? getPublicFileUrl(method.logo) : null,
        });
    }

    async update(id: string, dto: UpdatePaymentMethodesDto): Promise<BaseResponse<{ paymentMethodId: string }>> {
        const { logo, ...data } = dto as any;

        try {
            await this.prisma.paymentMethodes.update({ where: { id }, data });

            if (logo) {
                const uploadResult = await this.localStorage.saveFile(logo.buffer, 'payment-methodes');
                await this.prisma.paymentMethodes.update({
                    where: { id },
                    data: { logo: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(200, 'Méthode de paiement mise à jour', { paymentMethodId: id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour de la méthode de paiement');
        }
    }

    async delete(id: string) {
        await this.prisma.paymentMethodes.delete({ where: { id } });
        return new BaseResponse(200, 'Méthode de paiement supprimée');
    }
}

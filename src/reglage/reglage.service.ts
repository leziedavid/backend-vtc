import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreateReglageDto, UpdateReglageDto } from 'src/common/dto/request/reglage.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { BaseResponse } from 'src/utils/base-response';
import { getPublicFileUrl } from 'src/utils/helper';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class ReglageService {
    constructor(
        private prisma: PrismaService,
        private localStorage: LocalStorageService,
        private functionService: FunctionService,
    ) {}

    async create(dto: CreateReglageDto, userId: string): Promise<BaseResponse<{ reglageId: string }>> {
        const { headerLogo, footerLogo, ...data } = dto as any;

        try {
            const reglage = await this.prisma.reglage.create({
                data: { ...data, addedById: userId },
            });

            // Upload logos
            if (headerLogo) {
                const uploadHeader = await this.localStorage.saveFile(headerLogo.buffer, 'reglages');
                await this.prisma.reglage.update({ where: { id: reglage.id }, data: { headerLogo: uploadHeader.fileUrl } });
            }
            if (footerLogo) {
                const uploadFooter = await this.localStorage.saveFile(footerLogo.buffer, 'reglages');
                await this.prisma.reglage.update({ where: { id: reglage.id }, data: { footerLogo: uploadFooter.fileUrl } });
            }

            return new BaseResponse(201, 'Réglage créé avec succès', { reglageId: reglage.id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la création du réglage');
        }
    }

    async getAll(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;

        const data = await this.functionService.paginate<PaginateOptions>({
            model: 'Reglage',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: { select: null, include: { addedBy: true } },
            orderBy: { createdAt: 'desc' },
        });

        data.data = data.data.map(r => ({
            ...r,
            headerLogo: r.headerLogo ? getPublicFileUrl(r.headerLogo) : null,
            footerLogo: r.footerLogo ? getPublicFileUrl(r.footerLogo) : null,
        }));

        return new BaseResponse(200, 'Liste paginée des réglages', data);
    }

    async getAllHome(): Promise<BaseResponse<any>> {
        // ✅ Retourne toutes les réglages sans pagination
        const reglages = await this.prisma.reglage.findMany({
            orderBy: { createdAt: 'desc' },
            include: { addedBy: true },
        });
        const data = reglages.map(r => ({
            ...r,
            headerLogo: r.headerLogo ? getPublicFileUrl(r.headerLogo) : null,
            footerLogo: r.footerLogo ? getPublicFileUrl(r.footerLogo) : null,
        }));

        return new BaseResponse(200, 'Liste des réglages pour la page d’accueil', data);
    }

    async getOne(id: string) {
        const reglage = await this.prisma.reglage.findUnique({ where: { id }, include: { addedBy: true } });
        if (!reglage) throw new NotFoundException('Réglage non trouvé');

        return new BaseResponse(200, 'Réglage récupéré', {
            ...reglage,
            headerLogo: reglage.headerLogo ? getPublicFileUrl(reglage.headerLogo) : null,
            footerLogo: reglage.footerLogo ? getPublicFileUrl(reglage.footerLogo) : null,
        });
    }

    async update(id: string, dto: UpdateReglageDto): Promise<BaseResponse<{ reglageId: string }>> {
        const { headerLogo, footerLogo, ...data } = dto as any;

        try {
            await this.prisma.reglage.update({ where: { id }, data });

            if (headerLogo) {
                const uploadHeader = await this.localStorage.saveFile(headerLogo.buffer, 'reglages');
                await this.prisma.reglage.update({ where: { id }, data: { headerLogo: uploadHeader.fileUrl } });
            }
            if (footerLogo) {
                const uploadFooter = await this.localStorage.saveFile(footerLogo.buffer, 'reglages');
                await this.prisma.reglage.update({ where: { id }, data: { footerLogo: uploadFooter.fileUrl } });
            }

            return new BaseResponse(200, 'Réglage mis à jour', { reglageId: id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du réglage');
        }
    }

    async delete(id: string) {
        await this.prisma.reglage.delete({ where: { id } });
        return new BaseResponse(200, 'Réglage supprimé');
    }
    
}

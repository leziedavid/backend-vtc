import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { CreatePartenaireDto, UpdatePartenaireDto } from 'src/common/dto/request/partenaire.dto';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@Injectable()
export class PartenaireService {
    constructor(
        private prisma: PrismaService,
        private functionService: FunctionService,
        private localStorage: LocalStorageService,
    ) { }

    async create(dto: CreatePartenaireDto): Promise<BaseResponse<{ partenaireId: string }>> {
        const { logo, ...data } = dto as any;

        try {
            // Création sans logo
            const partenaire = await this.prisma.bunessPartner.create({ data });

            // Upload logo si présent
            if (logo) {
                const uploadResult = await this.localStorage.saveFile(logo.buffer, 'partenaires');
                await this.prisma.bunessPartner.update({
                    where: { id: partenaire.id },
                    data: { logo: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(201, 'Partenaire créé avec succès', { partenaireId: partenaire.id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la création du partenaire');
        }
    }

    async getAll(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const data = await this.functionService.paginate<PaginateOptions>({
            model: 'BunessPartner',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: { select: null, include: null },
            orderBy: { createdAt: 'desc' },
        });

        data.data = data.data.map(p => ({
            ...p,
            logo: p.logo ? getPublicFileUrl(p.logo) : null,
        }));

        return new BaseResponse(200, 'Liste paginée des partenaires', data);
    }

    async getAllByHome(): Promise<BaseResponse<any>> {
        // ✅ Retourne tous les partenaires sans pagination
        const partenaires = await this.prisma.bunessPartner.findMany({  orderBy: { createdAt: 'desc' }, });
        const data = partenaires.map(p => ({
            ...p,
            logo: p.logo ? getPublicFileUrl(p.logo) : null,
        }));
        return new BaseResponse(200, 'Liste des partenaires pour la page d’accueil', data);
    }

    async getOne(id: string) {
        const partenaire = await this.prisma.bunessPartner.findUnique({ where: { id } });
        if (!partenaire) throw new NotFoundException('Partenaire non trouvé');

        return new BaseResponse(200, 'Partenaire récupéré', {
            ...partenaire,
            logo: partenaire.logo ? getPublicFileUrl(partenaire.logo) : null,
        });
    }

    async update(id: string, dto: UpdatePartenaireDto): Promise<BaseResponse<{ partenaireId: string }>> {
        const { logo, ...data } = dto as any;

        try {
            await this.prisma.bunessPartner.update({ where: { id }, data });

            if (logo) {
                const uploadResult = await this.localStorage.saveFile(logo.buffer, 'partenaires');
                await this.prisma.bunessPartner.update({
                    where: { id },
                    data: { logo: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(200, 'Partenaire mis à jour', { partenaireId: id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du partenaire');
        }
    }

    async delete(id: string) {
        await this.prisma.bunessPartner.delete({ where: { id } });
        return new BaseResponse(200, 'Partenaire supprimé');
    }
    
}

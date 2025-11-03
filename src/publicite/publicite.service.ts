import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { CreatePubliciteDto, UpdatePubliciteDto } from 'src/common/dto/request/publicite.dto';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@Injectable()
export class PubliciteService {
    constructor(
        private prisma: PrismaService,
        private functionService: FunctionService,
        private localStorage: LocalStorageService,
    ) { }

    async create(dto: CreatePubliciteDto, userId: string): Promise<BaseResponse<{ publiciteId: string }>> {
        const { files, ...data } = dto as any;

        try {
            // Création sans fichier
            const pub = await this.prisma.publicite.create({
                data: {
                    ...data,
                    addedById: userId,
                },
            });

            // Upload fichier principal
            if (files) {
                const uploadResult = await this.localStorage.saveFile(files.buffer, 'publicites');
                await this.prisma.publicite.update({
                    where: { id: pub.id },
                    data: { files: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(201, 'Publicité créée avec succès', { publiciteId: pub.id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la création de la publicité');
        }
    }

    async getAll(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const data = await this.functionService.paginate<PaginateOptions>({
            model: 'Publicite',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: { select: null, include: { addedBy: true } },
            orderBy: { createdAt: 'desc' },
        });

        data.data = data.data.map(pub => ({
            ...pub,
            files: pub.files ? getPublicFileUrl(pub.files) : null,
        }));

        return new BaseResponse(200, 'Liste paginée des publicités', data);
    }

    async getAllHome(): Promise<BaseResponse<any>> {
        // ✅ Retourne toutes les publicités sans pagination
        const publicites = await this.prisma.publicite.findMany({
            orderBy: { createdAt: 'desc' },
            include: { addedBy: true },
        });
        const data = publicites.map(pub => ({
            ...pub,
            files: pub.files ? getPublicFileUrl(pub.files) : null,
        }));

        return new BaseResponse(200, 'Liste des publicités pour la page d’accueil', data);
    }


    async getOne(id: string) {
        const pub = await this.prisma.publicite.findUnique({ where: { id }, include: { addedBy: true } });
        if (!pub) throw new NotFoundException('Publicité non trouvée');

        return new BaseResponse(200, 'Publicité récupérée', {
            ...pub,
            files: pub.files ? getPublicFileUrl(pub.files) : null,
        });
    }

    async update(id: string, dto: UpdatePubliciteDto): Promise<BaseResponse<{ publiciteId: string }>> {
        const { files, ...data } = dto as any;

        try {
            await this.prisma.publicite.update({ where: { id }, data });

            if (files) {
                const uploadResult = await this.localStorage.saveFile(files.buffer, 'publicites');
                await this.prisma.publicite.update({
                    where: { id },
                    data: { files: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(200, 'Publicité mise à jour', { publiciteId: id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour de la publicité');
        }
    }

    async delete(id: string) {
        await this.prisma.publicite.delete({ where: { id } });
        return new BaseResponse(200, 'Publicité supprimée');
    }
}

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { CreateSliderDto, UpdateSliderDto } from 'src/common/dto/request/slider.dto';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@Injectable()
export class SliderService {
    constructor(
        private prisma: PrismaService,
        private functionService: FunctionService,
        private localStorage: LocalStorageService,
    ) {}

    async create(dto: CreateSliderDto, userId: string): Promise<BaseResponse<{ sliderId: string }>> {
        const { image, ...data } = dto as any;

        try {
            // Étape 1 : Création du slider sans image
            const slider = await this.prisma.slider.create({
                data: {
                    ...data,
                    addedById: userId,
                },
            });

            // Étape 2 : Upload image principale
            if (image) {
                const uploadResult = await this.localStorage.saveFile(image.buffer, 'sliders');
                await this.prisma.slider.update({
                    where: { id: slider.id },
                    data: { imageUrl: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(201, 'Slider créé avec succès', { sliderId: slider.id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la création du slider');
        }
    }

    async getAll(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const data = await this.functionService.paginate<PaginateOptions>({
            model: 'Slider',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: { select: null, include: { addedBy: true } },
            orderBy: { createdAt: 'desc' },
        });

        data.data = data.data.map(slider => ({
            ...slider,
            imageUrl: slider.imageUrl ? getPublicFileUrl(slider.imageUrl) : null,
        }));

        return new BaseResponse(200, 'Liste paginée des sliders', data);
    }

    async getOne(id: string) {
        const slider = await this.prisma.slider.findUnique({ where: { id }, include: { addedBy: true } });
        if (!slider) throw new NotFoundException('Slider non trouvé');

        return new BaseResponse(200, 'Slider récupéré', {
            ...slider,
            imageUrl: slider.imageUrl ? getPublicFileUrl(slider.imageUrl) : null,
        });
    }

    async update(id: string, dto: UpdateSliderDto): Promise<BaseResponse<{ sliderId: string }>> {
        const { image, ...data } = dto as any;

        try {
            await this.prisma.slider.update({ where: { id }, data });

            if (image) {
                const uploadResult = await this.localStorage.saveFile(image.buffer, 'sliders');
                await this.prisma.slider.update({
                    where: { id },
                    data: { imageUrl: uploadResult.fileUrl },
                });
            }

            return new BaseResponse(200, 'Slider mis à jour', { sliderId: id });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du slider');
        }
    }

    async delete(id: string) {
        await this.prisma.slider.delete({ where: { id } });
        return new BaseResponse(200, 'Slider supprimé');
    }
}

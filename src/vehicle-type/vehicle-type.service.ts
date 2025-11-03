import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleType } from '@prisma/client';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import {
    CreateVehicleTypeDto,
    UpdateVehicleTypeDto,
    VehicleTypeDto,
} from 'src/common/dto/request/vehicle-type.dto';

@Injectable()
export class VehicleTypeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) { }

    /** -------------------- Create VehicleType -------------------- */
    async create(dto: CreateVehicleTypeDto): Promise<BaseResponse<VehicleType>> {
        try {
            if (!dto.name) throw new BadRequestException('Le nom du type de véhicule est requis');
            if (dto.price == null)
                throw new BadRequestException('Le prix du type de véhicule est requis');

            const created = await this.prisma.vehicleType.create({
                data: {
                    name: dto.name,
                    description: dto.description ?? null,
                    price: dto.price,
                },
                include: { vehicles: true, commandes: true },
            });

            return new BaseResponse(201, 'Type de véhicule créé avec succès', created);
        } catch (error) {
            console.error('[VehicleTypeService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du type de véhicule');
        }
    }

    /** -------------------- Update VehicleType -------------------- */
    async update(id: string, dto: UpdateVehicleTypeDto): Promise<BaseResponse<VehicleType>> {
        try {
            const type = await this.prisma.vehicleType.findUnique({ where: { id } });
            if (!type) throw new NotFoundException('Type de véhicule introuvable');

            const updated = await this.prisma.vehicleType.update({
                where: { id },
                data: {
                    name: dto.name ?? undefined,
                    description: dto.description ?? undefined,
                    price: dto.price ?? undefined,
                },
                include: { vehicles: true, commandes: true },
            });

            return new BaseResponse(200, 'Type de véhicule mis à jour avec succès', updated);
        } catch (error) {
            console.error('[VehicleTypeService.update] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du type de véhicule');
        }
    }

    /** -------------------- Get by ID -------------------- */
    async findById(id: string): Promise<BaseResponse<VehicleTypeDto>> {
        const type = await this.prisma.vehicleType.findUnique({
            where: { id },
            include: { vehicles: true, commandes: true },
        });

        if (!type) throw new NotFoundException('Type de véhicule introuvable');
        return new BaseResponse(200, 'Type de véhicule récupéré avec succès', type);
    }

    /** -------------------- Delete VehicleType -------------------- */
    async delete(id: string): Promise<BaseResponse<VehicleType>> {
        try {
            const type = await this.prisma.vehicleType.findUnique({ where: { id } });
            if (!type) throw new NotFoundException('Type de véhicule introuvable');

            await this.prisma.vehicleType.delete({ where: { id } });
            return new BaseResponse(200, 'Type de véhicule supprimé avec succès', type);
        } catch (error) {
            console.error('[VehicleTypeService.delete] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression du type de véhicule');
        }
    }

    /** -------------------- List paginated VehicleTypes -------------------- */
    async findAllPaginated(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'VehicleType',
                page: Number(params.page) || 1,
                limit: Number(params.limit) || 10,
                selectAndInclude: {
                    select: null,
                    include: { vehicles: true, commandes: true },
                },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Types de véhicules récupérés avec succès', data);
        } catch (error) {
            console.error('[VehicleTypeService.findAllPaginated] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des types de véhicules');
        }
    }

    /** -------------------- Simple findAll (non paginé) -------------------- */
    async findAll(): Promise<BaseResponse<VehicleType[]>> {
        try {
            const data = await this.prisma.vehicleType.findMany({
                include: { vehicles: true, commandes: true },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Types de véhicules récupérés avec succès', data);
        } catch (error) {
            console.error('[VehicleTypeService.findAll] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des types de véhicules');
        }
    }

    /** -------------------- 🧩 Get All For Front (key/value) -------------------- */
    async getAllByFront(): Promise<BaseResponse<{ key: string; value: string }[]>> {
        try {
            const data = await this.prisma.vehicleType.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            });

            const formatted = data.map((item) => ({
                key: item.id,
                value: item.name,
            }));

            return new BaseResponse(
                200,
                'Types de véhicules pour le front récupérés avec succès',
                formatted,
            );
        } catch (error) {
            console.error('[VehicleTypeService.getAllByFront] ❌', error);
            throw new InternalServerErrorException(
                'Erreur lors de la récupération des types de véhicules (front)',
            );
        }
    }
    
}

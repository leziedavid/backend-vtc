import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User, Vehicle, VehicleStatus } from '@prisma/client';
import { GenericService } from 'src/utils/generic.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleDto } from 'src/common/dto/request/vehicle.dto';
import { BaseResponse } from 'src/utils/base-response';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { getPublicFileUrl } from 'src/utils/helper';

@Injectable()
export class VehicleService {
    private generic: GenericService<Vehicle>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,) {
        this.generic = new GenericService<Vehicle>(prisma, 'vehicle');
    }

    /** -------------------- Create Vehicle -------------------- */
    async create(dto: CreateVehicleDto, partnerId: string): Promise<BaseResponse<Vehicle>> {
        const { registration, typeId, driverId, images, marque, models, year, color, mileage, seats, status } = dto;

        try {
            // ✅ Convertir driverId (string | string[]) en tableau
            let driverIds = Array.isArray(driverId) ? driverId : driverId ? [driverId] : [];

            // 🔹 Vérification du type de véhicule
            const typeExists = await this.prisma.vehicleType.findUnique({ where: { id: typeId } });
            if (!typeExists) throw new BadRequestException('Type de véhicule introuvable');

            // 🔹 Si aucun driver n’est fourni → utiliser le partner comme driver par défaut
            if (driverIds.length === 0) {
                const partner = await this.prisma.user.findUnique({ where: { id: partnerId } });
                if (!partner) throw new BadRequestException('Partenaire introuvable');
                driverIds = [partnerId];
            }

            // 🔹 Vérification des drivers
            const drivers = await this.prisma.user.findMany({ where: { id: { in: driverIds } } });
            if (drivers.length !== driverIds.length) throw new BadRequestException('Un ou plusieurs conducteurs introuvables');

            // 🔹 Création du véhicule
            const vehicle = await this.prisma.vehicle.create({
                data: {
                    registration,
                    marque,
                    models,
                    year: Number(year),
                    color,
                    mileage: mileage !== undefined ? Number(mileage) : undefined,
                    seats: seats !== undefined ? Number(seats) : undefined,
                    status,
                    type: { connect: { id: typeId } },
                    partner: { connect: { id: partnerId } },
                    drivers: { connect: driverIds.map((id) => ({ id })), },
                },
                include: { drivers: true, type: true, partner: true },
            });

            // 🔹 Upload images si présentes
            if (images && images.length > 0) {
                for (const file of images) {
                    await this.uploadFile(vehicle.id, file.buffer, 'vehicleImage', 'vehicles');
                }
            }

            return new BaseResponse(201, 'Véhicule créé avec succès', vehicle);
        } catch (error) {
            console.error('[VehicleService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du véhicule', error);
        }
    }

    /** -------------------- Update Vehicle -------------------- */
    async update(vehicleId: string, dto: UpdateVehicleDto): Promise<BaseResponse<Vehicle>> {
        const { registration, typeId, driverId, marque, models, year, color, mileage, seats, status, images, partnerId } = dto;

        try {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
                include: { drivers: true },
            });
            if (!vehicle) throw new BadRequestException('Véhicule introuvable');

            // ✅ Convertir driverId (string | string[]) en tableau
            let driverIds = Array.isArray(driverId)
                ? driverId
                : driverId
                    ? [driverId]
                    : [];

            // ✅ Vérification du type de véhicule si fourni
            if (typeId) {
                const typeExists = await this.prisma.vehicleType.findUnique({ where: { id: typeId } });
                if (!typeExists) throw new BadRequestException('Type de véhicule introuvable');
            }

            // ✅ Si aucun driver fourni → on garde les existants ou on met le partner
            if (driverIds.length === 0) {
                if (vehicle.drivers.length === 0) {
                    const effectivePartnerId = partnerId || vehicle.partnerId;
                    if (effectivePartnerId) {
                        const partner = await this.prisma.user.findUnique({ where: { id: effectivePartnerId } });
                        if (!partner) throw new BadRequestException('Partenaire introuvable');
                        driverIds = [effectivePartnerId];
                    }
                }
            }

            // ✅ Vérification des drivers (sécurité)
            if (driverIds.length > 0) {
                const drivers = await this.prisma.user.findMany({ where: { id: { in: driverIds } } });
                if (drivers.length !== driverIds.length) {
                    throw new BadRequestException('Un ou plusieurs conducteurs introuvables');
                }
            }

            // ✅ Filtrer les nouveaux drivers non encore assignés
            const existingDriverIds = vehicle.drivers.map((d) => d.id);
            const newDriverIds = driverIds.filter((id) => !existingDriverIds.includes(id));

            // ✅ Mise à jour du véhicule
            const updatedVehicle = await this.prisma.vehicle.update({
                where: { id: vehicleId },
                data: {
                    ...(registration && { registration }),
                    ...(marque && { marque }),
                    ...(models && { models }),
                    ...(year !== undefined && { year: Number(year) }),
                    ...(color && { color }),
                    ...(mileage !== undefined && { mileage: Number(mileage) }),
                    ...(seats !== undefined && { seats: Number(seats) }),
                    ...(status && { status }),
                    ...(typeId && { type: { connect: { id: typeId } } }),
                    ...(partnerId && { partner: { connect: { id: partnerId } } }),
                    ...(newDriverIds.length > 0 && {
                        drivers: {
                            connect: newDriverIds.map((id) => ({ id })),
                        },
                    }),
                },
                include: { drivers: true, type: true, partner: true },
            });

            // ✅ Upload images si présentes
            if (images && images.length > 0) {
                for (const file of images) {
                    await this.uploadFile(vehicleId, file.buffer, 'vehicleImage', 'vehicles');
                }
            }

            return new BaseResponse(200, 'Véhicule mis à jour avec succès', updatedVehicle);
        } catch (error) {
            console.error('[VehicleService.update] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du véhicule');
        }
    }


    /** -------------------- Create Vehicle -------------------- */
    async create2(dto: CreateVehicleDto, partnerId: string): Promise<BaseResponse<Vehicle>> {
        const { registration, typeId, driverId, images, marque, models, year, color, mileage, seats, status } = dto;

        try {
            // ✅ Convertir driverId (string | string[]) en tableau
            const driverIds = Array.isArray(driverId)
                ? driverId
                : driverId
                    ? [driverId]
                    : [];

            // Vérification du type de véhicule
            const typeExists = await this.prisma.vehicleType.findUnique({ where: { id: typeId } });
            if (!typeExists) throw new BadRequestException('Type de véhicule introuvable');

            // Vérification des drivers si fournis
            if (driverIds.length > 0) {
                const drivers = await this.prisma.user.findMany({ where: { id: { in: driverIds } } });
                if (drivers.length !== driverIds.length) throw new BadRequestException('Un ou plusieurs conducteurs introuvables');
            }

            // Création du véhicule
            const vehicle = await this.prisma.vehicle.create({
                data: {
                    registration,
                    marque,
                    models,
                    year: Number(year),
                    color,
                    mileage: mileage !== undefined ? Number(mileage) : undefined,
                    seats: seats !== undefined ? Number(seats) : undefined,
                    status,
                    type: { connect: { id: typeId } },
                    partner: { connect: { id: partnerId } },
                    ...(driverIds.length > 0 && {
                        drivers: {
                            connect: driverIds.map((id) => ({ id })),
                        },
                    }),
                },
                include: { drivers: true, type: true, partner: true },
            });

            // Upload images si présentes
            if (images && images.length > 0) {
                for (const file of images) {
                    await this.uploadFile(vehicle.id, file.buffer, 'vehicleImage', 'vehicles');
                }
            }

            return new BaseResponse(201, 'Véhicule créé avec succès', vehicle);
        } catch (error) {
            console.error('[VehicleService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du véhicule');
        }
    }

    /** -------------------- Update Vehicle -------------------- */
    async update2(vehicleId: string, dto: UpdateVehicleDto): Promise<BaseResponse<Vehicle>> {
        const { registration, typeId, driverId, marque, models, year, color, mileage, seats, status, images, partnerId } = dto;

        try {
            const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) throw new BadRequestException('Véhicule introuvable');

            // ✅ Convertir driverId (string | string[]) en tableau
            const driverIds = Array.isArray(driverId)
                ? driverId
                : driverId
                    ? [driverId]
                    : [];

            // Vérification du type si fourni
            if (typeId) {
                const typeExists = await this.prisma.vehicleType.findUnique({ where: { id: typeId } });
                if (!typeExists) throw new BadRequestException('Type de véhicule introuvable');
            }

            // Vérification des drivers si fournis
            if (driverIds.length > 0) {
                const drivers = await this.prisma.user.findMany({ where: { id: { in: driverIds } } });
                if (drivers.length !== driverIds.length) throw new BadRequestException('Un ou plusieurs conducteurs introuvables');
            }

            // Mise à jour du véhicule
            const updatedVehicle = await this.prisma.vehicle.update({
                where: { id: vehicleId },
                data: {
                    registration,
                    marque,
                    models,
                    year: Number(year),
                    color,
                    mileage: mileage !== undefined ? Number(mileage) : undefined,
                    seats: seats !== undefined ? Number(seats) : undefined,
                    status,
                    ...(typeId && { type: { connect: { id: typeId } } }),
                    ...(partnerId && { partner: { connect: { id: partnerId } } }),
                    ...(driverIds.length > 0 && {
                        // 🔄 Remplacement complet des drivers associés
                        drivers: {
                            set: [],
                            connect: driverIds.map((id) => ({ id })),
                        },
                    }),
                },
                include: { drivers: true, type: true, partner: true },
            });

            // Upload images si présentes
            if (images && images.length > 0) {
                for (const file of images) {
                    await this.uploadFile(vehicleId, file.buffer, 'vehicleImage', 'vehicles');
                }
            }

            return new BaseResponse(200, 'Véhicule mis à jour avec succès', updatedVehicle);
        } catch (error) {
            console.error('[VehicleService.update] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du véhicule');
        }
    }

    /** ---------------- GET VEHICLE BY ID ---------------- */

    async findById(id: string): Promise<BaseResponse<any>> {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: { type: true, partner: true, drivers: true, trajets: true },
        });
        if (!vehicle) throw new BadRequestException('Véhicule introuvable');

        // 🔹 Récupération des fichiers liés
        const files = await this.prisma.fileManager.findMany({
            where: { targetId: id, fileType: 'vehicleFiles' },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Véhicule récupéré avec succès', {
            ...vehicle,
            files: files.map(f => getPublicFileUrl(f.fileUrl)),
        });
    }

    /** -------------------- Paginated Vehicles -------------------- */
    async getAllPaginate(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<Vehicle>({
                model: 'Vehicle',
                page: Number(params.page) || 1,
                limit: Number(params.limit) || 10,
                selectAndInclude: {
                    select: null,
                    include: { type: true, partner: true, drivers: true, trajets: true },
                },
                orderBy: { createdAt: 'desc' },
            });

            return await this.attachVehicleFiles(data);
        } catch (error) {
            console.error('[VehicleService.getAllPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des véhicules');
        }
    }

    /** -------------------- Filter Vehicles Paginated -------------------- */
    async filterPaginated(filterParams: Partial<VehicleDto>, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            // 🔹 Pour filtrer par driverId, on convertit si présent
            if (filterParams.driverId) {
                filterParams['drivers'] = { some: { id: filterParams.driverId } };
                delete filterParams.driverId;
            }

            const data = await this.functionService.paginate<Vehicle>({
                model: 'Vehicle',
                page: Number(params.page) || 1,
                limit: Number(params.limit) || 10,
                selectAndInclude: {
                    select: null,
                    include: { type: true, partner: true, drivers: true, trajets: true },
                },
                conditions: filterParams,
                orderBy: { createdAt: 'desc' },
            });

            return await this.attachVehicleFiles(data);
        } catch (error) {
            console.error('[VehicleService.filterPaginated] ❌', error);
            throw new InternalServerErrorException('Erreur lors du filtrage des véhicules');
        }
    }

    /** -------------------- Vehicles by Partner -------------------- */
    async findByPartner(partnerId: string, params?: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<Vehicle>({
                model: 'Vehicle',
                page: Number(params?.page) || 1,
                limit: Number(params?.limit) || 10,
                selectAndInclude: {
                    select: null,
                    include: { type: true, drivers: true, trajets: true },
                },
                conditions: { partnerId },
                orderBy: { createdAt: 'desc' },
            });

            return await this.attachVehicleFiles(data);
        } catch (error) {
            console.error('[VehicleService.findByPartner] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des véhicules du partenaire');
        }
    }

    /** -------------------- Vehicles by Driver -------------------- */
    async findByDriver(driverId: string, params?: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<Vehicle>({
                model: 'Vehicle',
                page: Number(params?.page) || 1,
                limit: Number(params?.limit) || 10,
                selectAndInclude: {
                    select: null,
                    include: { type: true, partner: true, trajets: true, drivers: true },
                },
                conditions: {
                    drivers: {
                        some: { id: driverId } // 🔹 Correct N:N
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            return await this.attachVehicleFiles(data);
        } catch (error) {
            console.error('[VehicleService.findByDriver] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des véhicules du driver');
        }
    }

    /** -------------------- Owner Vehicles (Partner or Driver) -------------------- */
    async findVehicles(userId: string, role: Role, params?: PaginationParamsDto): Promise<BaseResponse<any>> {
        const conditions: Record<string, any> = {};

        if (role === 'PARTENAIRE') conditions.partnerId = userId;
        else if (role === 'DRIVER') conditions.drivers = { some: { id: userId } };
        else throw new BadRequestException('Rôle non autorisé pour récupérer les véhicules');

        try {
            const data = await this.functionService.paginate<Vehicle>({
                model: 'Vehicle',
                page: Number(params?.page) || 1,
                limit: Number(params?.limit) || 10,
                selectAndInclude: {
                    select: null,
                    include: { type: true, partner: true, drivers: true, trajets: true },
                },
                conditions,
                orderBy: { createdAt: 'desc' },
            });

            return await this.attachVehicleFiles(data);
        } catch (error) {
            console.error('[VehicleService.findVehicles] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des véhicules');
        }
    }

    /** -------------------- Helper : Attach Vehicle Files -------------------- */
    private async attachVehicleFiles(data: any): Promise<BaseResponse<any>> {
        const vehicleIds = data.data.map((v: Vehicle) => v.id);
        const allFiles = await this.prisma.fileManager.findMany({
            where: { targetId: { in: vehicleIds }, fileType: 'vehicleImage' },
            orderBy: { createdAt: 'desc' },
        });

        const filesMap: Record<string, string[]> = {};
        for (const file of allFiles) {
            if (!filesMap[file.targetId]) filesMap[file.targetId] = [];
            filesMap[file.targetId].push(getPublicFileUrl(file.fileUrl));
        }

        const vehiclesWithFiles = data.data.map((v: Vehicle) => ({
            ...v,
            images: filesMap[v.id] || [],
        }));

        return new BaseResponse(200, 'Véhicules récupérés avec succès', {
            ...data,
            data: vehiclesWithFiles,
        });
    }

    /** -------------------- Affecter ou retirer un driver -------------------- */
    async assignDriver( vehicleId: string,  driverId: string | string[], action: 'assign' | 'remove' = 'assign'): Promise<BaseResponse<Vehicle>> {
        try {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
                include: { drivers: true }, // inclure les drivers existants
            });
            if (!vehicle) throw new BadRequestException('Véhicule introuvable');

            // Convertir driverId en tableau si c'est un seul ID
            const driverIds = Array.isArray(driverId) ? driverId : [driverId];

            // Vérifier que chaque driver existe
            for (const id of driverIds) {
                const driverExists = await this.prisma.user.findUnique({ where: { id } });
                if (!driverExists) throw new BadRequestException(`Driver introuvable: ${id}`);
            }

            let updatedVehicle: Vehicle;

            if (action === 'assign') {
                // 🔹 Vérifier les doublons
                const alreadyAssigned = driverIds.filter(id =>
                    vehicle.drivers.some(d => d.id === id)
                );

                if (alreadyAssigned.length > 0) {
                    return new BaseResponse(
                        400,
                        `Le(s) driver(s) ${alreadyAssigned.join(', ')} est/sont déjà affecté(s) à ce véhicule.`,
                        vehicle
                    );
                }

                updatedVehicle = await this.prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: {
                        drivers: {
                            connect: driverIds.map((id) => ({ id })),
                        },
                    },
                    include: { drivers: true, type: true, partner: true, trajets: true },
                });

                return new BaseResponse(200, 'Driver(s) affecté(s) avec succès', updatedVehicle);
            } else if (action === 'remove') {
                updatedVehicle = await this.prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: {
                        drivers: {
                            disconnect: driverIds.map((id) => ({ id })),
                        },
                    },
                    include: { drivers: true, type: true, partner: true, trajets: true },
                });

                return new BaseResponse(200, 'Driver(s) retiré(s) avec succès', updatedVehicle);
            } else {
                throw new BadRequestException('Action invalide');
            }
        } catch (error) {
            console.error('[VehicleService.assignDriver] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la modification du driver');
        }
    }

    /** -------------------- Affecter ou retirer un driver -------------------- */
    async assignDriver2(vehicleId: string, driverId: string | string[], action: 'assign' | 'remove' = 'assign'): Promise<BaseResponse<Vehicle>> {
        try {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
                include: { drivers: true }, // inclure les drivers existants
            });
            if (!vehicle) throw new BadRequestException('Véhicule introuvable');

            // Convertir driverId en tableau si c'est un seul ID
            const driverIds = Array.isArray(driverId) ? driverId : [driverId];

            // Vérifier que chaque driver existe
            for (const id of driverIds) {
                const driverExists = await this.prisma.user.findUnique({ where: { id } });
                if (!driverExists) throw new BadRequestException(`Driver introuvable: ${id}`);
            }

            let updatedVehicle: Vehicle;

            if (action === 'assign') {
                updatedVehicle = await this.prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: {
                        drivers: {
                            connect: driverIds.map((id) => ({ id })),
                        },
                    },
                    include: { drivers: true, type: true, partner: true, trajets: true },
                });
                return new BaseResponse(200, 'Driver(s) affecté(s) avec succès', updatedVehicle);
            } else if (action === 'remove') {
                updatedVehicle = await this.prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: {
                        drivers: {
                            disconnect: driverIds.map((id) => ({ id })),
                        },
                    },
                    include: { drivers: true, type: true, partner: true, trajets: true },
                });
                return new BaseResponse(200, 'Driver(s) retiré(s) avec succès', updatedVehicle);
            } else {
                throw new BadRequestException('Action invalide');
            }
        } catch (error) {
            console.error('[VehicleService.assignDriver] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la modification du driver');
        }
    }

    /** -------------------- Delete Vehicle -------------------- */
    async delete(vehicleId: string): Promise<BaseResponse<Vehicle>> {
        try {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: vehicleId },
                include: {
                    drivers: true,
                    trajets: true,
                    type: true,
                    partner: true,
                },
            });

            if (!vehicle) throw new BadRequestException('Véhicule introuvable');

            // ✅ 1️⃣ Supprimer les fichiers associés (images du véhicule)
            const vehicleFiles = await this.prisma.fileManager.findMany({
                where: { targetId: vehicleId, fileType: 'vehicleImage' },
            });

            for (const file of vehicleFiles) {
                try {
                    await this.localStorage.deleteFile(file.fileCode);
                } catch (err) {
                    console.warn(`⚠️ Erreur suppression fichier Cloudinary pour ${file.fileUrl}`, err);
                }
            }

            await this.prisma.fileManager.deleteMany({
                where: { targetId: vehicleId, fileType: 'vehicleImage' },
            });

            // ✅ 2️⃣ Supprimer les trajets liés (si tu veux tout nettoyer)
            if (vehicle.trajets.length > 0) {
                await this.prisma.trajet.deleteMany({
                    where: { vehicleId },
                });
            }

            // ✅ 3️⃣ Supprimer les relations avec les drivers
            if (vehicle.drivers.length > 0) {
                await this.prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: { drivers: { set: [] } }, // déconnexion propre
                });
            }

            // ✅ 4️⃣ Enfin, suppression du véhicule
            const deletedVehicle = await this.prisma.vehicle.delete({
                where: { id: vehicleId },
            });

            return new BaseResponse(200, 'Véhicule supprimé avec succès', deletedVehicle);
        } catch (error) {
            console.error('[VehicleService.delete] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression du véhicule');
        }
    }


    /** -------------------- Upload File -------------------- */

    private async uploadFile(userId: string, fileBuffer: Buffer | string, fileType: string, folder: string) {
        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: userId, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.localStorage.deleteFile(existingFile.fileCode);
            } catch (err) {
                console.warn(`Erreur suppression du fichier ${existingFile.fileCode}: ${err.message}`);
            }
            await this.prisma.fileManager.deleteMany({ where: { targetId: userId, fileType } });
        }

        const uploadResult = await this.localStorage.saveFile(fileBuffer, folder);
        await this.prisma.fileManager.create({
            data: { ...uploadResult, fileType, targetId: userId },
        });
    }

    /** -------------------- Liste des drivers assignés à un véhicule -------------------- */

    async getAssignedDrivers(vehicleId: string, params: PaginationParamsDto,): Promise<BaseResponse<any>> {

        if (!vehicleId) throw new BadRequestException('Véhicule introuvable');

        try {
            const page = Number(params.page) || 1;
            const limit = Number(params.limit) || 10;

            // 🔹 On demande à la pagination de renvoyer totalElements
            const data = await this.functionService.paginate<User>({
                model: 'User',
                page,
                limit,
                includeTotalElements: true,
                selectAndInclude: {
                    include: {
                        vehicles: {
                            select: {
                                id: true,
                                registration: true,
                                marque: true,
                                models: true,
                                type: { select: { id: true, name: true } },
                                status: true,
                            },
                        },
                    },
                },
                conditions: {
                    vehicles: { some: { id: vehicleId } },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (!data.data.length) {
                return new BaseResponse(200, 'Aucun driver assigné à ce véhicule', data);
            }

            const driverIds = data.data.map((d) => d.id);
            const driverPhotos = await this.prisma.fileManager.findMany({
                where: { targetId: { in: driverIds }, fileType: 'userFiles' },
                select: { targetId: true, fileUrl: true },
                orderBy: { createdAt: 'desc' },
                distinct: ['targetId'],
            });

            const photosMap = new Map(driverPhotos.map((p) => [p.targetId, getPublicFileUrl(p.fileUrl)]));

            const drivers = data.data.map((driver) => ({
                ...driver,
                image: photosMap.get(driver.id) || null,
                vehicles: driver.vehicles.map((v) => ({
                    id: v.id,
                    registration: v.registration,
                    marque: v.marque,
                    models: v.models,
                    type: v.type || null,
                    status: v.status,
                })),
            }));

            // 🔹 Retour avec totalElements inclus
            return new BaseResponse(200, 'Drivers assignés récupérés avec succès', {
                ...data,
                data: drivers, // on remplace data par les drivers enrichis
            });
        } catch (error) {
            console.error('[VehicleService.getAssignedDrivers] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des drivers assignés');
        }
    }


}

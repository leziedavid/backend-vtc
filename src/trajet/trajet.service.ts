import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Trajet } from '@prisma/client';
import { BaseResponse } from 'src/utils/base-response';
import { CreateTrajetDto, UpdateTrajetDto } from 'src/common/dto/request/trajet.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { SearchTrajetDto } from 'src/common/dto/request/search-trajet.dto';
import { calculateEstimatedDuration } from 'src/utils/calculateEstimatedDuration';

@Injectable()
export class TrajetService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService
    ) { }

    /** -------------------- Create Trajet -------------------- */

    async create(dto: CreateTrajetDto): Promise<BaseResponse<Trajet>> {
        try {
            // Vérification driver
            const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
            if (!driver) throw new BadRequestException('Driver introuvable');

            // Vérification véhicule
            const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
            if (!vehicle) throw new BadRequestException('Véhicule introuvable');

            // Conversion stops
            const stopsJson = dto.stops?.map(s => ({
                name: s.location,
                lat: Number(s.latitude),
                lng: Number(s.longitude),
                arrivalTime: s.arrivalTime ? new Date(s.arrivalTime).toISOString() : null,
            })) ?? [];

            // Création du trajet avec relations connectées
            const { driverId, vehicleId, departureLatitude, departureLongitude, arrivalLatitude, arrivalLongitude, ...rest } = dto;
            const estimatedDurations = calculateEstimatedDuration(dto.departureTime, dto.estimatedArrival);

            const trajet = await this.prisma.trajet.create({
                data: {
                    ...rest,
                    driver: { connect: { id: driverId } },
                    vehicle: { connect: { id: vehicleId } },
                    departureGPS: { lat: Number(departureLatitude), lng: Number(departureLongitude) },
                    destinationGPS: { lat: Number(arrivalLatitude), lng: Number(arrivalLongitude) },
                    stops: stopsJson,
                    departureTime: new Date(dto.departureTime),
                    estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : null,
                    totalDistance: dto.totalDistance ? Number(dto.totalDistance) : null,
                    estimatedDuration: estimatedDurations,
                },
                include: {
                    driver: true,
                    vehicle: true,
                    commandes: true,
                },
            });

            return new BaseResponse(201, 'Trajet créé avec succès', this.formatTrajet(trajet));
        } catch (error) {
            console.error('[TrajetService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création du trajet');
        }
    }

    /** -------------------- Update Trajet -------------------- */
    async update(trajetId: string, dto: UpdateTrajetDto): Promise<BaseResponse<Trajet>> {
        try {
            const trajet = await this.prisma.trajet.findUnique({ where: { id: trajetId } });
            if (!trajet) throw new NotFoundException('Trajet introuvable');

            const dataToUpdate: any = {};

            if (dto.driverId) {
                const driverExists = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
                if (!driverExists) throw new BadRequestException('Driver introuvable');
                dataToUpdate.driver = { connect: { id: dto.driverId } };
            }

            if (dto.vehicleId) {
                const vehicleExists = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
                if (!vehicleExists) throw new BadRequestException('Véhicule introuvable');
                dataToUpdate.vehicle = { connect: { id: dto.vehicleId } };
            }

            const stopsJson = dto.stops?.map(s => ({
                name: s.location,
                lat: Number(s.latitude),
                lng: Number(s.longitude),
                arrivalTime: s.arrivalTime ? new Date(s.arrivalTime).toISOString() : null,
            }));

            const estimatedDurations = calculateEstimatedDuration(dto.departureTime, dto.estimatedArrival);

            Object.assign(dataToUpdate, {
                departure: dto.departure ?? undefined,
                departureGPS: dto.departureLatitude && dto.departureLongitude ? { lat: Number(dto.departureLatitude), lng: Number(dto.departureLongitude) } : undefined,
                destination: dto.destination ?? undefined,
                destinationGPS: dto.arrivalLatitude && dto.arrivalLongitude ? { lat: Number(dto.arrivalLatitude), lng: Number(dto.arrivalLongitude) } : undefined,
                stops: stopsJson ?? undefined,
                departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
                estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : undefined,
                totalDistance: dto.totalDistance ? Number(dto.totalDistance) : undefined,
                estimatedDuration: estimatedDurations,
                disposition: dto.disposition ?? undefined,
                nbplaces: dto.nbplaces ?? undefined,
                price: dto.price ?? undefined,
            });

            const updated = await this.prisma.trajet.update({
                where: { id: trajetId },
                data: dataToUpdate,
                include: {
                    driver: true,
                    vehicle: true,
                    commandes: true,
                },
            });

            return new BaseResponse(200, 'Trajet mis à jour avec succès', this.formatTrajet(updated));
        } catch (error) {
            console.error('[TrajetService.update] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du trajet');
        }
    }


    /** -------------------- Get Trajet By Id -------------------- */
    async findById(trajetId: string): Promise<BaseResponse<Trajet>> {
        const trajet = await this.prisma.trajet.findUnique({
            where: { id: trajetId },
            include: { driver: true, vehicle: true, commandes: true },
        });
        if (!trajet) throw new NotFoundException('Trajet introuvable');
        return new BaseResponse(200, 'Trajet récupéré avec succès', this.formatTrajet(trajet));
    }


    /** -------------------- List Trajets paginés -------------------- */
    async findAllPaginated(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Trajet',
                page: params.page,
                limit: params.limit,
                selectAndInclude: { select: null, include: { driver: true, vehicle: true, commandes: true } },
                orderBy: { createdAt: 'desc' },
            });

            const formattedData = data.data.map((t: Trajet) => this.formatTrajet(t));

            return new BaseResponse(200, 'Trajets récupérés avec succès', { ...data, data: formattedData });
        } catch (error) {
            console.error('[TrajetService.findAllPaginated] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des trajets');
        }
    }

    /** -------------------- Get Trajets by Driver -------------------- */
    async findByDriver(driverId: string, params?: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Trajet',
                page: params?.page ?? 1,
                limit: params?.limit ?? 10,
                selectAndInclude: { select: null, include: { vehicle: true, commandes: true, driver: true } },
                conditions: { driverId },
                orderBy: { departureTime: 'desc' },
            });

            const formattedData = data.data.map((t: Trajet) => this.formatTrajet(t));

            return new BaseResponse(200, 'Trajets du driver récupérés avec succès', { ...data, data: formattedData });
        } catch (error) {
            console.error('[TrajetService.findByDriver] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des trajets du driver');
        }
    }

    /** -------------------- Get Trajets by Vehicle -------------------- */
    async findByVehicle(vehicleId: string, params?: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Trajet',
                page: params?.page ?? 1,
                limit: params?.limit ?? 10,
                selectAndInclude: { select: null, include: { driver: true, commandes: true, vehicle: true } },
                conditions: { vehicleId },
                orderBy: { departureTime: 'desc' },
            });

            const formattedData = data.data.map((t: Trajet) => this.formatTrajet(t));

            return new BaseResponse(200, 'Trajets du véhicule récupérés avec succès', { ...data, data: formattedData });
        } catch (error) {
            console.error('[TrajetService.findByVehicle] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des trajets du véhicule');
        }
    }

    /** -------------------- Delete Trajet -------------------- */
    async delete(trajetId: string): Promise<BaseResponse<Trajet>> {
        try {
            const trajet = await this.prisma.trajet.findUnique({ where: { id: trajetId } });
            if (!trajet) throw new NotFoundException('Trajet introuvable');

            await this.prisma.trajet.delete({ where: { id: trajetId } });
            return new BaseResponse(200, 'Trajet supprimé avec succès', this.formatTrajet(trajet));
        } catch (error) {
            console.error('[TrajetService.delete] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression du trajet');
        }
    }

    /** -------------------- Search intelligente Trajets -------------------- */
    async searchTrajets(
        query: SearchTrajetDto,
        page = 1,
        limit = 10
    ): Promise<BaseResponse<any>> {
        try {
            const { depart, destination } = query;

            // Vérification minimale
            if (!depart && !destination) {
                throw new BadRequestException('Départ ou destination requis (nom)');
            }

            // 🔹 Conditions dynamiques pour recherche principale par nom
            const conditions: any = { AND: [] };
            if (depart) conditions.AND.push({ departure: { contains: depart, mode: 'insensitive' } });
            if (destination) conditions.AND.push({ destination: { contains: destination, mode: 'insensitive' } });

            if (conditions.AND.length === 0) delete conditions.AND;

            console.log('🔍 [SearchTrajets] Conditions:', JSON.stringify(conditions, null, 2));

            // 🔹 Recherche principale paginée
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Trajet',
                page,
                limit,
                selectAndInclude: {
                    include: { driver: true, vehicle: true, commandes: true }, // ✅ on inclut les relations
                },
                conditions,
                orderBy: { departureTime: 'desc' },
            });

            // console.log('🔍 [SearchTrajets] Data:', data);

            let formattedData = data.data.map(t => this.formatTrajet(t));

            // 🔹 Fallback sur stops si aucun trajet direct trouvé
            if (!formattedData.length && (depart || destination)) {
                console.log('⚠️ Aucun trajet direct trouvé, fallback sur stops...');

                const allTrajets = await this.prisma.trajet.findMany({
                    include: { driver: true, vehicle: true, commandes: true },
                });

                const filteredByStops = allTrajets.filter(t => {
                    if (!t.stops || !Array.isArray(t.stops)) return false;

                    let matchDep = !depart;
                    let matchDest = !destination;

                    t.stops.forEach((stop: any) => {
                        if (depart && stop.name?.toLowerCase().includes(depart.toLowerCase())) matchDep = true;
                        if (destination && stop.name?.toLowerCase().includes(destination.toLowerCase())) matchDest = true;
                    });

                    return matchDep && matchDest;
                });

                formattedData = filteredByStops.map(t => this.formatTrajet(t));

                return new BaseResponse(200, 'Trajets trouvés via stops', {
                    data: formattedData,
                    total: filteredByStops.length,
                    page,
                    limit,
                });
            }

            return new BaseResponse(200, 'Trajets trouvés avec succès', {
                ...data,
                data: formattedData,
            });
        } catch (error) {
            console.error('[TrajetService.searchTrajets] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la recherche des trajets');
        }
    }


    /** -------------------- Search inteligente Trajets -------------------- */
    async searchTrajets2(query: SearchTrajetDto, page = 1, limit = 10): Promise<BaseResponse<any>> {
        try {
            const { depart, destination, departureLat, departureLng, destinationLat, destinationLng } = query;

            if ((!depart && departureLat == null && departureLng == null) ||
                (!destination && destinationLat == null && destinationLng == null)) {
                throw new BadRequestException('Départ et destination sont requis (nom ou coordonnées)');
            }

            // 🔹 Conditions dynamiques pour recherche directe
            let conditions: any = {};

            if (depart && destination) {
                conditions.AND = [
                    { departure: { contains: depart, mode: 'insensitive' } },
                    { destination: { contains: destination, mode: 'insensitive' } },
                ];
            }

            if (departureLat != null && departureLng != null &&
                destinationLat != null && destinationLng != null) {
                const delta = 0.01; // tolérance ~1km
                conditions.AND = [
                    { departureGPS: { path: '$.lat', gte: departureLat - delta, lte: departureLat + delta } },
                    { departureGPS: { path: '$.lng', gte: departureLng - delta, lte: departureLng + delta } },
                    { destinationGPS: { path: '$.lat', gte: destinationLat - delta, lte: destinationLat + delta } },
                    { destinationGPS: { path: '$.lng', gte: destinationLng - delta, lte: destinationLng + delta } },
                ];
            }

            // 🔹 Pagination via functionService
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'Trajet',
                page,
                limit,
                selectAndInclude: { select: null, include: { driver: true, vehicle: true, commandes: true } },
                conditions,
                orderBy: { departureTime: 'desc' },
            });

            let formattedData = data.data.map(t => this.formatTrajet(t));

            // 🔹 Si aucun trajet direct trouvé, fallback sur stops
            if (!formattedData.length) {
                const allTrajets = await this.prisma.trajet.findMany({
                    include: { driver: true, vehicle: true, commandes: true },
                });

                const filteredByStops = allTrajets.filter(t => {
                    if (!t.stops || !Array.isArray(t.stops)) return false;

                    return t.stops.some((s: any) => {
                        let matchDepart = true;
                        let matchDestination = true;
                        if (depart) matchDepart = s.name.toLowerCase().includes(depart.toLowerCase());
                        if (destination) matchDestination = s.name.toLowerCase().includes(destination.toLowerCase());
                        return matchDepart && matchDestination;
                    });
                });

                formattedData = filteredByStops.slice((page - 1) * limit, page * limit).map(t => this.formatTrajet(t));

                return new BaseResponse(200, 'Trajets trouvés via stops', {
                    data: formattedData,
                    total: filteredByStops.length,
                    page,
                    limit,
                });
            }

            return new BaseResponse(200, 'Trajets trouvés avec succès', { ...data, data: formattedData });
        } catch (error) {
            console.error('[TrajetService.searchTrajets] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la recherche des trajets');
        }
    }


    /** -------------------- Helper : format trajet pour le front -------------------- */
    private formatTrajet(trajet: Trajet): any {
        const stops = Array.isArray(trajet.stops)
            ? (trajet.stops as any[]).map(s => ({
                name: s.name,
                lat: s.lat,
                lng: s.lng,
                arrivalTime: s.arrivalTime ? new Date(s.arrivalTime) : null,
            }))
            : [];

        return {
            ...trajet,
            stops,
            estimatedDuration: trajet.estimatedDuration ?? null,
        };
    }
}

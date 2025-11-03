import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreateVehicleDto, UpdateVehicleDto, VehicleDto } from 'src/common/dto/request/vehicle.dto';
import { VehicleService } from './vehicle.service';
import { AssignDriverDto } from 'src/common/dto/request/assign-driver.dto';

@ApiTags('Vehicle Api')
@ApiBearerAuth('access-token')
@Controller('vehicle')
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    /** --------------------- Création véhicule --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau véhicule' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 201, description: 'Véhicule créé avec succès.' })
    async createVehicle(
        @UploadedFiles() files: { images?: Express.Multer.File[] },
        @Body() dto: CreateVehicleDto,
        @Req() req: Request,
    ) {
        const user = req.user as any;
        return this.vehicleService.create({ ...dto, images: files?.images }, user.id);
    }

    /** --------------------- Mise à jour véhicule --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un véhicule' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
    @ApiResponse({ status: 200, description: 'Véhicule mis à jour.' })
    async updateVehicle(
        @Param('id') id: string,
        @UploadedFiles() files: { images?: Express.Multer.File[] },
        @Body() dto: UpdateVehicleDto,
    ) {
        return this.vehicleService.update(id, { ...dto, images: files?.images });
    }

    /** --------------------- Suppression véhicule --------------------- */
    // @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un véhicule' })
    @ApiResponse({ status: 200, description: 'Véhicule supprimé avec succès.' })
    async deleteVehicle(@Param('id') id: string) {
        return this.vehicleService.delete(id);
    }

    /** --------------------- Récupérer véhicule par ID --------------------- */
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un véhicule par ID' })
    @ApiResponse({ status: 200, description: 'Véhicule récupéré avec succès.' })
    async getVehicleById(@Param('id') id: string) {
        return this.vehicleService.findById(id);
    }

    /** --------------------- Liste paginée de tous les véhicules --------------------- */
    @Get()
    @ApiOperation({ summary: 'Liste paginée de tous les véhicules' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllVehicles(@Query() params: PaginationParamsDto) {
        return this.vehicleService.getAllPaginate(params);
    }

    /** --------------------- Filtrer véhicules avec pagination --------------------- */
    @Post('filter')
    @ApiOperation({ summary: 'Filtrer les véhicules avec pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async filterVehicles(@Body() filter: Partial<VehicleDto>, @Query() params: PaginationParamsDto,) {
        return this.vehicleService.filterPaginated(filter, params);
    }

    /** --------------------- Véhicules du partenaire ou driver connecté --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('owner/drivers')
    @ApiOperation({ summary: 'Récupérer les véhicules du partenaire ou driver connecté avec pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getVehiclesByOwner(
        @Req() req: any,
        @Query() params: PaginationParamsDto,
    ) {
        const user = req.user as any;
        // On transmet l'id et le role de l'utilisateur connecté + pagination
        return this.vehicleService.findVehicles(user.id, user.role, params);
    }

    /** --------------------- Affecter ou retirer un driver --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/driver')
    @ApiOperation({ summary: 'Affecter ou retirer un driver à un véhicule' })
    @ApiResponse({ status: 200, description: 'Driver affecté ou retiré.' })
    @ApiConsumes('application/json')
    async assignDriver(  @Param('id') vehicleId: string, @Body() dto: AssignDriverDto,
    ) {
        return this.vehicleService.assignDriver(vehicleId, dto.driverId, dto.action);
    }



    /** --------------------- Récupérer les drivers assignés --------------------- */
    /** --------------------- Récupérer les drivers assignés à un véhicule --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get(':id/drivers')
    @ApiOperation({ summary: 'Récupérer les drivers assignés à un véhicule (paginé)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAssignedDrivers(
        @Param('id') vehicleId: string,
        @Query() params: PaginationParamsDto,
    ) {
        return this.vehicleService.getAssignedDrivers(vehicleId, params);
    }


}

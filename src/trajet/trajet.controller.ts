import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TrajetService } from './trajet.service';
import { CreateTrajetDto, UpdateTrajetDto } from 'src/common/dto/request/trajet.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { SearchTrajetDto } from 'src/common/dto/request/search-trajet.dto';

@ApiTags('Trajet Api')
@ApiBearerAuth('access-token')
@Controller('trajet')
export class TrajetController {
    constructor(private readonly trajetService: TrajetService) { }

    /** --------------------- Création trajet --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau trajet' })
    @ApiResponse({ status: 201, description: 'Trajet créé avec succès.' })
    async createTrajet(@Body() dto: CreateTrajetDto) {
        return this.trajetService.create(dto);
    }

    /** --------------------- Mise à jour trajet --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un trajet' })
    @ApiResponse({ status: 200, description: 'Trajet mis à jour avec succès.' })
    async updateTrajet(@Param('id') id: string, @Body() dto: UpdateTrajetDto) {
        return this.trajetService.update(id, dto);
    }

    /** --------------------- Suppression trajet --------------------- */
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un trajet' })
    @ApiResponse({ status: 200, description: 'Trajet supprimé avec succès.' })
    async deleteTrajet(@Param('id') id: string) {
        return this.trajetService.delete(id);
    }

    /** --------------------- Récupérer trajet par ID --------------------- */
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un trajet par ID' })
    @ApiResponse({ status: 200, description: 'Trajet récupéré avec succès.' })
    async getTrajetById(@Param('id') id: string) {
        return this.trajetService.findById(id);
    }

    /** --------------------- Liste paginée de tous les trajets --------------------- */
    @Get()
    @ApiOperation({ summary: 'Liste paginée de tous les trajets' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllTrajets(@Query() params: PaginationParamsDto) {
        return this.trajetService.findAllPaginated(params);
    }

    /** --------------------- Trajets par driver --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('liste/trajets/driver')
    @ApiOperation({ summary: 'Récupérer les trajets d’un driver' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTrajetsByDriver( @Req() req: any, @Query() params?: PaginationParamsDto,) {
        const user = req.user as any;
        return this.trajetService.findByDriver(user.id, params);
    }

    /** --------------------- Trajets par véhicule --------------------- */
    @Get('vehicle/:vehicleId')
    @ApiOperation({ summary: 'Récupérer les trajets d’un véhicule' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTrajetsByVehicle(@Param('vehicleId') vehicleId: string,
        @Query() params?: PaginationParamsDto,) {
        return this.trajetService.findByVehicle(vehicleId, params);
    }


    /** --------------------- Recherche trajet --------------------- */
    @Get('search/trajet')
    @ApiOperation({ summary: 'Rechercher un trajet par départ et destination (nom ou coordonnées)' })
    @ApiQuery({ name: 'depart', required: true, type: String })
    @ApiQuery({ name: 'destination', required: true, type: String })
    @ApiQuery({ name: 'departureLat', required: false, type: Number })
    @ApiQuery({ name: 'departureLng', required: false, type: Number })
    @ApiQuery({ name: 'destinationLat', required: false, type: Number })
    @ApiQuery({ name: 'destinationLng', required: false, type: Number })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async searchTrajets( @Query() query: SearchTrajetDto,  @Query('page') page = 1, @Query('limit') limit = 10, ) {
        return this.trajetService.searchTrajets(query, Number(page), Number(limit));
    }


}

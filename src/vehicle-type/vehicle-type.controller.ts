import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { VehicleTypeService } from './vehicle-type.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreateVehicleTypeDto, UpdateVehicleTypeDto, VehicleTypeDto } from 'src/common/dto/request/vehicle-type.dto';


@ApiTags('Vehicle Type Api')
@ApiBearerAuth('access-token')
@Controller('vehicle-type')
export class VehicleTypeController {
    constructor(private readonly vehicleTypeService: VehicleTypeService) {}

    /** --------------------- Création d’un type de véhicule --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un type de véhicule' })
    @ApiResponse({ status: 201, description: 'Type de véhicule créé avec succès.', type: VehicleTypeDto, })
    async createVehicleType(@Body() dto: CreateVehicleTypeDto) {
        return this.vehicleTypeService.create(dto);
    }

    /** --------------------- Mise à jour d’un type de véhicule --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un type de véhicule' })
    @ApiResponse({ status: 200,  description: 'Type de véhicule mis à jour avec succès.', type: VehicleTypeDto, })
    async updateVehicleType( @Param('id') id: string,  @Body() dto: UpdateVehicleTypeDto, ) {
        return this.vehicleTypeService.update(id, dto);
    }

    /** --------------------- Suppression d’un type de véhicule --------------------- */
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un type de véhicule' })
    @ApiResponse({
        status: 200,
        description: 'Type de véhicule supprimé avec succès.',
    })
    async deleteVehicleType(@Param('id') id: string) {
        return this.vehicleTypeService.delete(id);
    }

    /** --------------------- Récupérer un type de véhicule par ID --------------------- */
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un type de véhicule par ID' })
    @ApiResponse({ status: 200,  description: 'Type de véhicule récupéré avec succès.', type: VehicleTypeDto,})
    async getVehicleTypeById(@Param('id') id: string) {
        return this.vehicleTypeService.findById(id);
    }

    /** --------------------- Liste paginée des types de véhicules --------------------- */
    @Get()
    @ApiOperation({ summary: 'Liste paginée des types de véhicules' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({  status: 200, description: 'Liste paginée récupérée avec succès.',})
    async getAllVehicleTypes(@Query() params: PaginationParamsDto) {
        return this.vehicleTypeService.findAllPaginated(params);
    }

    /** --------------------- Liste complète (non paginée) --------------------- */
    @Get('all/list')
    @ApiOperation({ summary: 'Récupérer tous les types de véhicules (non paginé)' })
    @ApiResponse({ status: 200, description: 'Liste complète récupérée avec succès.', type: [VehicleTypeDto],})
    async getAllVehicleTypesList() {
        return this.vehicleTypeService.findAll();
    }

    /** --------------------- Liste key/value pour le front --------------------- */
    @Get('front/all')
    @ApiOperation({
        summary: 'Récupérer tous les types de véhicules (key/value) pour le front',
    })
    @ApiResponse({
        status: 200,
        description: 'Types de véhicules pour le front récupérés avec succès.',
        schema: {
            example: [
                { key: 'uuid-vehicletype-1', value: 'Économique' },
                { key: 'uuid-vehicletype-2', value: 'Luxe' },
            ],
        },
    })
    async getAllByFront() {
        return this.vehicleTypeService.getAllByFront();
    }
}

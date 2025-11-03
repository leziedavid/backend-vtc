import {Controller,Get,Post,Patch,Body,Param,UseGuards,Query,Req,} from '@nestjs/common';
import {ApiTags,ApiOperation,ApiResponse,ApiBearerAuth,} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CommandeService } from './commande.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CommandeStatus } from '@prisma/client';
import { CreateCommandeDto } from 'src/common/dto/request/commande.dto';

@ApiTags('Commande Api')
@ApiBearerAuth('access-token')
@Controller('commande')
export class CommandeController {
    constructor(private readonly commandeService: CommandeService) {}

    /** --------------------- Création d’une commande --------------------- */
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle commande (par le client)' })
    @ApiResponse({ status: 201, description: 'Commande créée avec succès.' })
    async create(@Req() req: any, @Body() dto: CreateCommandeDto) {
        const user = req.user as any;
        return this.commandeService.create(dto);
    }

    /** --------------------- Liste paginée des commandes --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister toutes les commandes (paginées)' })
    @ApiResponse({ status: 200, description: 'Liste paginée des commandes.' })
    async getPaginatedCommandes(@Query() params: PaginationParamsDto) {
        return this.commandeService.findPaginated(params);
    }

    /** --------------------- Validation d’une commande --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/validate')
    @ApiOperation({ summary: 'Valider une commande (par le chauffeur)' })
    @ApiResponse({ status: 200, description: 'Commande validée avec succès.' })
    async validateCommande(@Req() req: any, @Param('id') id: string) {
        const user = req.user as any;
        return this.commandeService.validateCommande(user.id, id);
    }

    /** --------------------- Annulation d’une commande --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Annuler une commande (par le client ou chauffeur)' })
    @ApiResponse({ status: 200, description: 'Commande annulée avec succès.' })
    async cancelCommande(
        @Req() req: any,
        @Param('id') id: string,
        @Body('role') role: 'USER' | 'DRIVER',
    ) {
        const user = req.user as any;
        return this.commandeService.cancelCommande(user.id, role, id);
    }

    /** --------------------- Démarrer une commande --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/start')
    @ApiOperation({ summary: 'Démarrer une commande (chauffeur uniquement)' })
    @ApiResponse({ status: 200, description: 'Commande démarrée avec succès.' })
    async startCommande(@Req() req: any, @Param('id') id: string) {
        const user = req.user as any;
        return this.commandeService.startCommande(user.id, id);
    }

    /** --------------------- Terminer une commande --------------------- */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/complete')
    @ApiOperation({ summary: 'Terminer une commande (chauffeur uniquement)' })
    @ApiResponse({ status: 200, description: 'Commande terminée avec succès.' })
    async completeCommande(@Req() req: any, @Param('id') id: string) {
        const user = req.user as any;
        return this.commandeService.completeCommande(user.id, id);
    }

    /** --------------------- Liste des statuts disponibles --------------------- */
    @Get('status/list')
    @ApiOperation({ summary: 'Lister tous les statuts de commande disponibles' })
    @ApiResponse({ status: 200, description: 'Liste des statuts retournée.' })
    getStatusList() {
        return Object.values(CommandeStatus);
    }
}

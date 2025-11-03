import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PaymentMethodesService } from './payment-methodes.service';
import { CreatePaymentMethodesDto, UpdatePaymentMethodesDto } from 'src/common/dto/request/payment-methodes.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('Payment Methodes Api')
@ApiBearerAuth('access-token')
@Controller('payment-methode')

export class PaymentMethodesController {
    constructor(private readonly paymentMethodesService: PaymentMethodesService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle méthode de paiement' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }]))
    @ApiResponse({ status: 201, description: 'Méthode de paiement créée avec succès.' })
    @ApiBody({ type: CreatePaymentMethodesDto })
    async create(
        @UploadedFiles() files: { logo?: Express.Multer.File[] },
        @Body() dto: CreatePaymentMethodesDto,
    ) {
        dto.logo = files.logo?.[0] ?? null;
        return this.paymentMethodesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Liste paginée des méthodes de paiement' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getAll(@Query() params: PaginationParamsDto) {
        return this.paymentMethodesService.getAll(params);
    }

    // <-- Ajout demandé : liste pour la page d'accueil (sans pagination)
    @Get('home')
    @ApiOperation({ summary: 'Liste des méthodes de paiement pour la page d\'accueil' })
    async getAllHome() {
        return this.paymentMethodesService.getAllHome();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une méthode de paiement par ID' })
    async getOne(@Param('id') id: string) {
        return this.paymentMethodesService.getOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une méthode de paiement' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }]))
    async update(
        @Param('id') id: string,
        @UploadedFiles() files: { logo?: Express.Multer.File[] },
        @Body() dto: UpdatePaymentMethodesDto,
    ) {
        dto.logo = files.logo?.[0] ?? null;
        return this.paymentMethodesService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une méthode de paiement' })
    async delete(@Param('id') id: string) {
        return this.paymentMethodesService.delete(id);
    }
}

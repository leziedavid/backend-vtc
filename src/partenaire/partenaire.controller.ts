import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PartenaireService } from './partenaire.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreatePartenaireDto, UpdatePartenaireDto } from 'src/common/dto/request/partenaire.dto';

@ApiTags('Partenaire Api')
@ApiBearerAuth('access-token')
@Controller('partenaire')
export class PartenaireController {
    constructor(private readonly partenaireService: PartenaireService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau partenaire' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }]))
    @ApiBody({ type: CreatePartenaireDto })
    async createPartenaire(
        @UploadedFiles() files: { logo?: Express.Multer.File[] },
        @Body() dto: CreatePartenaireDto,
    ) {
        dto.logo = files.logo?.[0] ?? null;
        return this.partenaireService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Liste paginée des partenaires' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getAll(@Query() params: PaginationParamsDto) {
        return this.partenaireService.getAll(params);
    }

    // ✅ Nouvelle route pour récupérer tous les partenaires pour la page d’accueil
    @Get('home')
    @ApiOperation({ summary: 'Liste des partenaires pour la page d’accueil (sans pagination)' })
    async getAllByHome() {
        return this.partenaireService.getAllByHome();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un partenaire par ID' })
    async getOne(@Param('id') id: string) {
        return this.partenaireService.getOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un partenaire' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }]))
    async update( @Param('id') id: string, @UploadedFiles() files: { logo?: Express.Multer.File[] }, @Body() dto: UpdatePartenaireDto,) {
        dto.logo = files.logo?.[0] ?? null;
        return this.partenaireService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un partenaire' })
    async delete(@Param('id') id: string) {
        return this.partenaireService.delete(id);
    }
}

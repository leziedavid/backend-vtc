import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PubliciteService } from './publicite.service';
import { Request } from 'express';
import { CreatePubliciteDto, UpdatePubliciteDto } from 'src/common/dto/request/publicite.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('Publicite Api')
@ApiBearerAuth('access-token')
@Controller('publicite')
export class PubliciteController {
    constructor(private readonly publiciteService: PubliciteService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle publicité' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 1 }]))
    @ApiResponse({ status: 201, description: 'Publicité créée avec succès.' })
    @ApiBody({ type: CreatePubliciteDto })
    async createPublicite(
        @UploadedFiles() files: { files?: Express.Multer.File[] },
        @Body() dto: CreatePubliciteDto,
        @Req() req: Request,
    ) {
        dto.files = files.files?.[0] ?? null;
        const user = req.user as any;
        return this.publiciteService.create(dto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Liste paginée des publicités' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getAll(@Query() params: PaginationParamsDto) {
        return this.publiciteService.getAll(params);
    }

    @Get('home')
    @ApiOperation({ summary: 'Liste paginée des publicités pour l\'accueil' })
    async getAllHome() {
        return this.publiciteService.getAllHome();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une publicité par ID' })
    async getOne(@Param('id') id: string) {
        return this.publiciteService.getOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une publicité' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 1 }]))
    
    async update(
        @Param('id') id: string,
        @UploadedFiles() files: { files?: Express.Multer.File[] },
        @Body() dto: UpdatePubliciteDto,
    ) {
        dto.files = files.files?.[0] ?? null;
        return this.publiciteService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une publicité' })
    async delete(@Param('id') id: string) {
        return this.publiciteService.delete(id);
    }
}

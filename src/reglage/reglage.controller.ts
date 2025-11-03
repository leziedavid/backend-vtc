import { Controller, Post, Get, Patch, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ReglageService } from './reglage.service';
import { Request } from 'express';
import { CreateReglageDto, UpdateReglageDto } from 'src/common/dto/request/reglage.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('Reglage Api')
@ApiBearerAuth('access-token')
@Controller('reglage')
export class ReglageController {
    constructor(private readonly reglageService: ReglageService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un réglage' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'headerLogo', maxCount: 1 },
        { name: 'footerLogo', maxCount: 1 },
    ]))
    @ApiResponse({ status: 201, description: 'Réglage créé avec succès.' })
    @ApiBody({ type: CreateReglageDto })
    async createReglage(
        @UploadedFiles() files: { headerLogo?: Express.Multer.File[]; footerLogo?: Express.Multer.File[] },
        @Body() dto: CreateReglageDto,
        @Req() req: Request,
    ) {
        dto.headerLogo = files.headerLogo?.[0] ?? null;
        dto.footerLogo = files.footerLogo?.[0] ?? null;
        const user = req.user as any;
        return this.reglageService.create(dto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Liste paginée des réglages' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getAll(@Query() params: PaginationParamsDto) {
        return this.reglageService.getAll(params);
    }

    @Get('home')
    @ApiOperation({ summary: 'Liste des réglages pour la page d’accueil' })
    async getAllHome() {
        return this.reglageService.getAllHome();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un réglage par ID' })
    async getOne(@Param('id') id: string) {
        return this.reglageService.getOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un réglage' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'headerLogo', maxCount: 1 },
        { name: 'footerLogo', maxCount: 1 },
    ]))
    async update(
        @Param('id') id: string,
        @UploadedFiles() files: { headerLogo?: Express.Multer.File[]; footerLogo?: Express.Multer.File[] },
        @Body() dto: UpdateReglageDto,) {
        dto.headerLogo = files.headerLogo?.[0] ?? null;
        dto.footerLogo = files.footerLogo?.[0] ?? null;
        return this.reglageService.update(id, dto);
    }
}

import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { SliderService } from './slider.service';
import { Request } from 'express';
import { CreateSliderDto, UpdateSliderDto } from 'src/common/dto/request/slider.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('Slider Api')
@ApiBearerAuth('access-token')
@Controller('slider')
export class SliderController {
    constructor(private readonly sliderService: SliderService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau slider' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
    @ApiResponse({ status: 201, description: 'Slider créé avec succès.' })
    @ApiBody({ type: CreateSliderDto })
    async createSlider(
        @UploadedFiles() files: { image?: Express.Multer.File[] },
        @Body() dto: CreateSliderDto,
        @Req() req: Request,
    ) {
        dto.image = files.image?.[0] ?? null;
        const user = req.user as any;
        return this.sliderService.create(dto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Liste paginée des sliders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getAll(@Query() params: PaginationParamsDto) {
        return this.sliderService.getAll(params);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un slider par ID' })
    async getOne(@Param('id') id: string) {
        return this.sliderService.getOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un slider' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
    async update( @Param('id') id: string,
        @UploadedFiles() files: { image?: Express.Multer.File[] },
        @Body() dto: UpdateSliderDto, ) {
        dto.image = files.image?.[0] ?? null;
        return this.sliderService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un slider' })
    async delete(@Param('id') id: string) {
        return this.sliderService.delete(id);
    }
}

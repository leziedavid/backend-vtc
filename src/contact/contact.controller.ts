// src/contact/contact.controller.ts

import {Controller,Post,Patch,Delete,Get,Body,Param,Query,UseGuards,Req,ParseIntPipe} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ContactService } from './contact.service';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateContactDto, UpdateContactDto } from 'src/common/dto/request/contact.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';

@ApiTags('Contacts')
@ApiBearerAuth('access-token')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un contact' })
    @ApiResponse({ status: 201, description: 'Contact créé avec succès.' })
    async create(@Body() dto: CreateContactDto, @Req() req: Request) {
        const userId = (req.user as any).userId || (req.user as any).sub;
        return this.contactService.create(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un contact' })
    @ApiResponse({ status: 200, description: 'Contact mis à jour avec succès.' })
    async update(  @Param('id') id: string, @Body() dto: UpdateContactDto, @Req() req: Request,) {
        const userId = (req.user as any).id || (req.user as any).sub;
        return this.contactService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un contact' })
    @ApiResponse({ status: 200, description: 'Contact supprimé avec succès.' })
    async delete(@Param('id') id: string, @Req() req: Request) {
        const userId = (req.user as any).id || (req.user as any).sub;
        return this.contactService.remove(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Liste paginée des contacts' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste paginée des contacts retournée.' })
    async getAllContacts(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10,
        @Query() params: PaginationParamsDto,
    ) {
        return this.contactService.getAllPaginate(params.page, params.limit);
    }

    // @UseGuards(JwtAuthGuard)
    // @Get('user/:userId')
    // @ApiOperation({ summary: 'Récupérer les contacts d’un utilisateur' })
    // @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    // @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    // @ApiResponse({ status: 200, description: 'Contacts de l’utilisateur retournés.' })
    // async getByUserId(
    //     @Param('userId') userId: string,
    //     @Query() pagination: PaginationParamsDto,
    // ) {
    //     return this.contactService.getContactsByUserIdPaginated(userId, pagination);
    // }
}

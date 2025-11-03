// src/messages/message.controller.ts

import {Controller,Post,Patch,Delete,Get,Body,Param,Query,UploadedFile,UseInterceptors,UseGuards,Req,ParseIntPipe,InternalServerErrorException, UploadedFiles,} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {ApiTags,ApiOperation,ApiResponse,ApiConsumes,ApiBearerAuth,ApiQuery,} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { MessageService } from './message.service';
import { Request } from 'express';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreateMessageDto,UpdateMessageDto } from 'src/common/dto/request/createMessage.dto';


@ApiTags('Messages')
@ApiBearerAuth('access-token') // <- Ajout ici pour Swagger
@Controller('messages')

export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un message (texte et/ou image)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
    @ApiResponse({ status: 201, description: 'Message créé avec succès.' })
    async create(
        @UploadedFiles() files: { file?: Express.Multer.File[]},
        @Body() dto: CreateMessageDto,
        @Req() req: Request,
    ) {
        // dto.file = file ?? null;
        dto.file = files.file?.[0] ?? null;
        // userId depuis le token JWT
        const userId = (req.user as any).id|| (req.user as any).sub;
        // console.log(dto);
        return this.messageService.createMessage(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un message' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
    @ApiResponse({ status: 200, description: 'Message mis à jour avec succès.' })
    async update(
        @Param('id') id: string,
        @UploadedFiles() files: { file?: Express.Multer.File[]},
        @Body() dto: UpdateMessageDto,
        @Req() req: Request,
    ) {
        dto.file = files.file?.[0] ?? null;
        const userId = (req.user as any).id|| (req.user as any).sub;
        return this.messageService.updateMessage(userId, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un message' })
    @ApiResponse({ status: 200, description: 'Message supprimé avec succès.' })
    async delete(@Param('id') id: string, @Req() req: Request) {
        const userId = (req.user as any).id|| (req.user as any).sub;
        return this.messageService.deleteMessage(userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('order/:lastOrderId')
    @ApiOperation({ summary: 'Liste paginée des messages par lastOrderId' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste paginée des messages retournée.' })
    async getMessagesByOrderId(
        @Param('lastOrderId') lastOrderId: string,
        @Query() pagination: PaginationParamsDto,
        @Req() req: Request,) {
        const userId = (req.user as any).id|| (req.user as any).sub;
        return this.messageService.getMessagesByOrderIdPaginater(userId, lastOrderId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/messages')
    @ApiOperation({ summary: 'Liste paginée des messages envoyés par un utilisateur' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste paginée des messages envoyés par l’utilisateur.' })
    async getMessagesByUserId(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10,
        @Req() req: Request,
        @Query() pagination: PaginationParamsDto
    ) {
        const userId2 = (req.user as any).id|| (req.user as any).sub;
        return this.messageService.getMessagesByUserIdPaginated(userId2, pagination);
    }


    // getAllMessagesPaginated
    @UseGuards(JwtAuthGuard)
    @Get('user/messages/all')
    @ApiOperation({ summary: 'Liste paginée des messages envoyés par l’utilisateur' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste paginée des messages envoyés par l’utilisateur.' })
    async getAllMessagesPaginated(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10,
        @Req() req: Request,
        @Query() pagination: PaginationParamsDto
    ) {
        return this.messageService.getAllMessagesPaginated(pagination);
    }

    // getMessagesBySenderIdPaginated
    @UseGuards(JwtAuthGuard)
    @Get('user/messages/senderId/:senderId')
    @ApiOperation({ summary: 'Liste paginée des messages envoyés par l’utilisateur' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste paginée des messages envoyés par l’utilisateur.' })
    async getMessagesBySenderIdPaginated(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10,
        @Param('senderId') senderId: string,
        @Req() req: Request,
        @Query() pagination: PaginationParamsDto
    ) {
        console.log(senderId);
        return this.messageService.getMessagesBySenderIdPaginated(senderId, pagination);
    }

}

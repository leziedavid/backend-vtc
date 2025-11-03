import {Injectable,NotFoundException,UnauthorizedException,InternalServerErrorException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { FunctionService } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CreateMessageDto,UpdateMessageDto } from 'src/common/dto/request/createMessage.dto';


@Injectable()
export class MessageService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
    ) { }

    async createMessage(userId: string, dto: CreateMessageDto): Promise<BaseResponse<any>> {
        let imageUrl: string | undefined;

        if (dto.file) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'messages');
                imageUrl = upload.fileUrl;
            } catch {
                throw new InternalServerErrorException("Erreur lors de l’upload de l’image");
            }
        }

        if (dto.repliedToId) {
            const repliedMessage = await this.prisma.message.findUnique({
                where: { id: dto.repliedToId }, // dto.repliedToId est bien un string
            });
            if (!repliedMessage) {
                throw new NotFoundException("Message auquel vous répondez non trouvé");
            }
        }

        const message = await this.prisma.message.create({
            data: {
                text: dto.text || "",
                label: dto.label || "",
                repliedToId: dto.repliedToId || null,
                senderId: userId,
                sender: dto.sender, // enum MessageSender
                lastOrderId: dto.lastOrderId || null,
                imageUrl,
            },
        });

        return new BaseResponse(201, "Message créé", message);
    }


    async updateMessage(userId: string, id: string, dto: UpdateMessageDto): Promise<BaseResponse<any>> {
        const message = await this.prisma.message.findUnique({ where: { id } });
        if (!message) throw new NotFoundException("Message non trouvé");
        if (message.senderId !== userId) throw new UnauthorizedException("Modification non autorisée");

        let imageUrl: string | undefined;
        if (dto.file) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'messages');
                imageUrl = upload.fileUrl;
            } catch {
                throw new InternalServerErrorException("Erreur lors de l’upload de l’image");
            }
        }

        const updated = await this.prisma.message.update({
            where: { id },
            data: {
                text: dto.text ?? message.text,
                label: dto.label ?? message.label,
                repliedToId: dto.repliedToId ?? message.repliedToId,
                ...(imageUrl ? { imageUrl } : {}),
            },
        });

        return new BaseResponse(200, "Message mis à jour", updated);
    }


    async deleteMessage(userId: string, id: string): Promise<BaseResponse<null>> {
        const messageId = id;

        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message non trouvé');
        if (message.senderId !== userId) throw new UnauthorizedException('Suppression non autorisée');

        await this.prisma.message.delete({ where: { id: messageId } });

        return new BaseResponse(200, 'Message supprimé', null);
    }

    async getMessagesByOrderIdPaginater(
        userId: string,
        lastOrderId: string,
        params: PaginationParamsDto
    ): Promise<BaseResponse<any>> {
        // Optionnel : vérifier que user a accès à cette commande (à faire si besoin)

        const data = await this.functionService.paginate({
            model: 'Message',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: { lastOrderId },
            selectAndInclude: {
                select: null,
                include: {
                    repliedTo: true,
                    sender: { select: { id: true, name: true, email: true } },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return new BaseResponse(200, 'Messages paginés récupérés', data);
    }

    /** Récupère les messages envoyés par un utilisateur avec pagination */
    async getMessagesByUserIdPaginated(
        userId: string,
        params: PaginationParamsDto
    ): Promise<BaseResponse<any>> {
        const data = await this.functionService.paginate({
            model: 'Message',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: { senderId: userId },
            selectAndInclude: {
                select: null,
                include: {
                    repliedTo: true,
                    senderUser: { select: { id: true, name: true, email: true } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Messages de l’utilisateur récupérés', data);
    }

    /** Récupère tous les messages avec pagination */
    async getAllMessagesPaginated(
        params: PaginationParamsDto
    ): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'Message',
                page: Number(params.page),
                limit: Number(params.limit),
                conditions: {}, // pas de filtre, récupère tous les messages
                selectAndInclude: {
                    select: null,
                    include: {
                        repliedTo: true,
                        replies: true,
                        senderUser: { select: { id: true, name: true, email: true } },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });

            return new BaseResponse(200, 'Tous les messages récupérés', data);
        } catch (error) {
            console.error('Erreur lors de la récupération des messages :', error);
            throw new InternalServerErrorException('Impossible de récupérer les messages');
        }
    }

    /** Récupère les messages d'un utilisateur spécifique avec pagination */
    async getMessagesBySenderIdPaginated( senderId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'Message',
                page: Number(params.page),
                limit: Number(params.limit),
                conditions: {senderId: senderId },
                selectAndInclude: {
                    select: null,
                    include: {
                        repliedTo: true,
                        replies: true,
                        senderUser: { select: { id: true, name: true, email: true } },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });

            return new BaseResponse(200, `Messages de l'utilisateur ${senderId} récupérés avec succes`, data);
        } catch (error) {
            console.error(`Erreur lors de la récupération des messages pour l'utilisateur ${senderId}:`, error);
            throw new InternalServerErrorException('Impossible de récupérer les messages');
        }
    }


}

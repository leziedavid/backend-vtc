import { IsOptional, IsString, IsNumber, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MessageSender } from '@prisma/client';

export class CreateMessageDto {
    @ApiPropertyOptional({ description: 'Texte du message' })
    @IsOptional()
    @IsString()
    text?: string;

    // label
    @ApiPropertyOptional({ description: 'Libellé du message', example: 'Support client' })
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional({ description: 'ID du message auquel on répond' })
    @IsOptional()
    @IsNumber()
    repliedToId?: string;

    @ApiPropertyOptional({ description: 'ID de la commande liée (Trip, EcommerceOrder, Delivery)' })
    @IsOptional()
    @IsString()
    lastOrderId?: string;

    // sender types : user, support enum
    @ApiProperty({ enum: MessageSender, example: MessageSender.user, description: 'Type de message envoyé' })
    @IsEnum(MessageSender)
    sender: MessageSender;

    @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Fichier image (imageUrl) à envoyer avec le message',})
    @IsOptional()
    file?: any;
}
export class UpdateMessageDto extends PartialType(CreateMessageDto) { }



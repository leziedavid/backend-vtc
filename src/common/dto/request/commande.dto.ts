// commande.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';
import { CommandeStatus } from '@prisma/client';

export class CommandeDto {
    @ApiProperty({ example: 'uuid-commande-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'uuid-user-123' })
    @IsUUID()
    userId: string;

    @ApiProperty({ example: 'uuid-trajet-123' })
    @IsUUID()
    trajetId: string;

    @ApiProperty({ example: 'uuid-vehicletype-123' })
    @IsUUID()
    typeId: string;

    @ApiProperty({ example: 1800 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ enum: CommandeStatus, example: CommandeStatus.PENDING })
    @IsEnum(CommandeStatus)
    status: CommandeStatus;


    @ApiProperty({ example: '2025-05-01T10:00:00.000Z' })
    @IsDate()
    createdAt: Date;

    @ApiProperty({ example: '2025-05-01T12:00:00.000Z' })
    @IsDate()
    updatedAt: Date;
}

export class CreateCommandeDto extends OmitType(CommandeDto, ['id', 'createdAt', 'updatedAt'] as const) { }
export class UpdateCommandeDto extends PartialType(CreateCommandeDto) { }

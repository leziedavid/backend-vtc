// stop-point.dto.ts
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsUUID, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/** DTO pour un point d'arrêt */
export class StopPointDto {
    @ApiProperty({
        description: "UUID unique du point d'arrêt",
        example: "d5f7aeb2-1234-4e56-8b9c-7a9b4e7c1234",
    })
    @IsUUID()
    id: string;

    @ApiPropertyOptional({ description: 'Libellé du point d’arrêt', example: "Point d'arrêt 1" })
    @IsOptional()
    @IsString()
    location?: string; // utilisé côté front (anciennement label)

    @ApiProperty({ description: "Latitude du point d'arrêt", example: 48.8566, required: false })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiProperty({ description: "Longitude du point d'arrêt", example: 2.3522, required: false })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({ description: "Ordre du point d'arrêt dans la séquence du trajet", example: 1 })
    @IsOptional()
    @IsInt()
    order?: number;

    @ApiPropertyOptional({ description: "Heure d'arrivée estimée au point d'arrêt", example: "2025-10-22T10:30:00.000Z" })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    arrivalTime?: Date | string;
}

/** DTO pour création sans id */
export class CreateStopPointDto extends OmitType(StopPointDto, ['id'] as const) {}

/** DTO pour mise à jour partielle */
export class UpdateStopPointDto extends PartialType(CreateStopPointDto) {}

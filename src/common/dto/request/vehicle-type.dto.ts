import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class VehicleTypeDto {
    @ApiProperty({ example: 'uuid-vehicletype-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Économique', description: 'Nom du type de véhicule' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Type basique et abordable', description: 'Description du type de véhicule' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 1500, description: 'Prix de base pour ce type de véhicule' })
    @IsNumber()
    @Min(0)
    price: number;
}

/** -------------------- Création d’un type de véhicule -------------------- */
export class CreateVehicleTypeDto extends OmitType(VehicleTypeDto, ['id'] as const) {}

/** -------------------- Mise à jour d’un type de véhicule -------------------- */
export class UpdateVehicleTypeDto extends PartialType(CreateVehicleTypeDto) {}

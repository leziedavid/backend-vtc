// vehicle.dto.ts
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum VehicleStatus {
    AVAILABLE = "AVAILABLE",
    MAINTENANCE = "MAINTENANCE",
    OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export class VehicleDto {
    @ApiProperty({ example: 'uuid-vehicle-123' })
    id: string;

    @ApiProperty({ example: 'AB-123-CD' })
    @IsString()
    @IsNotEmpty()
    registration: string;

    @ApiProperty({ example: 'uuid-type-123' })
    @IsUUID()
    typeId: string;

    @ApiProperty({ example: 'Toyota' })
    @IsString()
    @IsNotEmpty()
    marque: string;

    @ApiProperty({ example: 'Corolla' })
    @IsString()
    @IsNotEmpty()
    models: string;

    @ApiProperty({ example: 2022 })
    @IsInt()
    @Min(1990)
    @Max(new Date().getFullYear())
    year: number;

    @ApiPropertyOptional({ example: 'Noir' })
    @IsString()
    @IsOptional()
    color?: string;

    @ApiPropertyOptional({ example: 15000 })
    @IsInt()
    @IsOptional()
    mileage?: number;

    @ApiPropertyOptional({ example: 4 })
    @IsInt()
    @IsOptional()
    seats?: number;

    @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
    @IsEnum(VehicleStatus)
    status: VehicleStatus;

    @ApiProperty({ example: 'uuid-partner-123', required: false })
    @IsOptional()
    @IsUUID()
    partnerId?: string;

    @ApiProperty({ example: 'uuid-driver-123', required: false })
    @IsOptional()
    @IsUUID()
    driverId?: string;

    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images à uploader (max 4)' })
    @IsOptional()
    @IsArray()
    images?: Express.Multer.File[];
}

export class CreateVehicleDto extends OmitType(VehicleDto, ['id'] as const) { }

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) { }

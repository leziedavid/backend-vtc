// trajet.dto.ts
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStopPointDto } from './stop-point.dto';

export class TrajetDto {
    @ApiProperty({ example: 'uuid-trajet-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'uuid-driver-123' })
    @IsUUID()
    driverId: string;

    @ApiProperty({ example: 'uuid-vehicle-123' })
    @IsUUID()
    vehicleId: string;

    @ApiProperty({ example: 'Paris' })
    @IsString()
    @IsNotEmpty()
    departure: string;

    @ApiProperty({ example: 1500, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    distance?: number;

    @ApiProperty({ example: 48.8566, required: false })
    @IsOptional()
    @IsNumber()
    departureLatitude?: number;

    @ApiProperty({ example: 2.3522, required: false })
    @IsOptional()
    @IsNumber()
    departureLongitude?: number;

    @ApiProperty({ example: 'Lyon' })
    @IsString()
    @IsNotEmpty()
    destination: string;

    @ApiProperty({ example: 45.7640, required: false })
    @IsOptional()
    @IsNumber()
    arrivalLatitude?: number;

    @ApiProperty({ example: 4.8357, required: false })
    @IsOptional()
    @IsNumber()
    arrivalLongitude?: number;

    @ApiProperty({ example: '2025-06-15T08:30:00.000Z' })
    @IsDate()
    @Type(() => Date)
    departureTime: Date | string;

    @ApiProperty({ example: '2025-06-15T12:45:00.000Z', required: false })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    estimatedArrival?: Date | string;

    @ApiProperty({ example: '4h15', required: false })
    @IsOptional()
    @IsString()
    estimatedDuration?: string;

    //  totalDistance
    @ApiProperty({ example: 1500, required: false })
    @IsOptional()
    @IsNumber()
    totalDistance?: number;

    @ApiProperty({ example: 'Trajet agréable avec pauses prévues', required: false })
    @IsOptional()
    @IsString()
    disposition?: string;
    // price
    @ApiProperty({ example: 1500, required: false })
    @IsOptional()
    @IsNumber()
    price?: number;


    @ApiProperty({ example: 1 })
    @IsNumber()
    @Min(1)
    nbplaces: number;


    @ApiProperty({ type: [CreateStopPointDto], required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateStopPointDto)
    stops?: CreateStopPointDto[];

    @ApiProperty({ example: '2025-05-01T10:00:00.000Z' })
    @IsDate()
    createdAt: Date;

    @ApiProperty({ example: '2025-05-01T12:00:00.000Z' })
    @IsDate()
    updatedAt: Date;
}

export class CreateTrajetDto extends OmitType(TrajetDto, ['id', 'createdAt', 'updatedAt'] as const) { }
export class UpdateTrajetDto extends PartialType(CreateTrajetDto) { }

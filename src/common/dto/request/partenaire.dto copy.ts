import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

/* ---------------- PARTENAIRE ---------------- */
export class PartenaireDto {
    @ApiProperty({ example: 'uuid-partenaire' })
    id: string;

    @ApiProperty()
    @IsString()
    libeller: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo du partenaire' })
    @IsOptional()
    logo?: any;

    @ApiProperty({ enum: Status, example: Status.ACTIVE })
    @IsOptional()
    @IsEnum(Status)
    status: Status;
}

export class CreatePartenaireDto extends OmitType(PartenaireDto, ['id'] as const) { }

export class UpdatePartenaireDto extends PartialType(CreatePartenaireDto) { }

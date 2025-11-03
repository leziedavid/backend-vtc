import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReglageDto {
    @ApiProperty({ example: 'uuid-reglage' })
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    footerDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    assistanceLine?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    emplacement?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fbUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    linkedinUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    xUrl?: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo en-tête' })
    @IsOptional()
    headerLogo?: any;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo pied de page' })
    @IsOptional()
    footerLogo?: any;
}

export class CreateReglageDto extends OmitType(ReglageDto, ['id'] as const) { }
export class UpdateReglageDto extends PartialType(CreateReglageDto) { }




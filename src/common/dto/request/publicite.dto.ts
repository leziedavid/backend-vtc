
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeFile } from '@prisma/client';


/* ---------------- PUBLICITE ---------------- */
export class PubliciteDto {
    @ApiProperty({ example: 'uuid-pub' })
    id: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    smallTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Fichier (image ou vidéo)' })
    @IsOptional()
    files?: any;

    @ApiProperty({ enum: TypeFile, example: TypeFile.IMAGE })
    @IsEnum(TypeFile)
    typeFiles: TypeFile;
}
export class CreatePubliciteDto extends OmitType(PubliciteDto, ['id'] as const) { }
export class UpdatePubliciteDto extends PartialType(CreatePubliciteDto) { }

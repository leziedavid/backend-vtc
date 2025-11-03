import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateFileManagerDto {
    @ApiProperty({ example: 'FILE-2025-001', description: 'Code unique du fichier' })
    @IsNotEmpty()
    @IsString()
    fileCode: string;

    @ApiProperty({ example: 'image-profil.png', description: 'Nom du fichier' })
    @IsNotEmpty()
    @IsString()
    fileName: string;

    @ApiProperty({ example: 'image/png', description: 'Type MIME du fichier' })
    @IsNotEmpty()
    @IsString()
    fileMimeType: string;

    @ApiProperty({ example: 2048, description: 'Taille du fichier en octets' })
    @IsNotEmpty()
    @IsNumber()
    fileSize: number;

    @ApiProperty({ example: 'https://cdn.example.com/files/image-profil.png', description: 'URL du fichier' })
    @IsNotEmpty()
    @IsString()
    fileUrl: string;

    @ApiProperty({ example: 'userFiles', description: 'Type de fichier (userFiles, storeFiles, productFiles)' })
    @IsNotEmpty()
    @IsString()
    fileType: string;

    @ApiProperty({ example: 'clx8g5ksl0000smv5v1v2t8pn', description: 'Identifiant de l’entité liée' })
    @IsNotEmpty()
    @IsString()
    targetId: string;

    @ApiPropertyOptional({ example: '/uploads/userFiles/image-profil.png', description: 'Chemin local du fichier' })
    @IsOptional()
    @IsString()
    filePath?: string;
}

export class UpdateFileManagerDto extends PartialType(CreateFileManagerDto) { }

export class FileManagerResponseDto {
    @ApiProperty({ example: 1, description: 'Identifiant du fichier' })
    id: number;

    @ApiProperty({ example: 'FILE-2025-001', description: 'Code du fichier' })
    fileCode: string;

    @ApiProperty({ example: 'image-profil.png', description: 'Nom du fichier' })
    fileName: string;

    @ApiProperty({ example: 'image/png', description: 'Type MIME' })
    fileMimeType: string;

    @ApiProperty({ example: 2048, description: 'Taille du fichier en octets' })
    fileSize: number;

    @ApiProperty({ example: 'https://cdn.example.com/files/image-profil.png', description: 'URL publique du fichier' })
    fileUrl: string;

    @ApiProperty({ example: 'userFiles', description: 'Type de fichier' })
    fileType: string;

    @ApiProperty({ example: 'clx8g5ksl0000smv5v1v2t8pn', description: 'Identifiant de la cible' })
    targetId: string;

    @ApiPropertyOptional({ example: '/uploads/userFiles/image-profil.png', description: 'Chemin local du fichier' })
    filePath?: string;

    @ApiProperty({ example: '2025-10-06T08:00:00.000Z', description: 'Date de création du fichier' })
    createdAt: Date;

    @ApiProperty({ example: '2025-10-06T10:00:00.000Z', description: 'Dernière mise à jour du fichier' })
    updatedAt: Date;
}

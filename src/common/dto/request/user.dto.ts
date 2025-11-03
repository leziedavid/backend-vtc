// user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';
import { PartialType, OmitType } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({ example: 'uuid-user-123' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    name: string;

    // phone

    @ApiProperty({ example: '+33600000000' })
    @IsString()
    phone: string;

    @ApiProperty({ enum: Role, example: Role.USER })
    @IsEnum(Role)
    role: Role;

    @ApiProperty({ description: 'UUID du partenaire', example: 'uuid-partner-123', required: false })
    @IsOptional()
    @IsUUID()
    partnerId?: string;

    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Images à uploader' })
    @IsOptional()
    @IsArray()
    images?: Express.Multer.File[];
}

export class CreateUserDto extends OmitType(UserDto, ['id'] as const) {
    @ApiProperty({ example: 'password123' })
    @IsString()
    password: string;
}


export class UpdateUserDto extends PartialType(CreateUserDto) { }

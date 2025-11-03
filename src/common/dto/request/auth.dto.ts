import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@gmail.com', description: 'Email ou numéro de téléphone' })
    @IsNotEmpty()
    identifiant: string; // peut être email ou téléphone

    @ApiProperty({ example: 'password123' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class AuthResponseDto {
    accessToken: string;
    refreshToken?: string;
}

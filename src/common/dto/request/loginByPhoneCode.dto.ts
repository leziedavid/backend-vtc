import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class LoginByPhoneCode {

    @ApiProperty({ example: 'ENR9654# ou 53686819', description: 'Code utilisateur ou numéro de téléphone' })
    @IsNotEmpty({ message: 'Le login est requis' })
    login: string;

    @ApiProperty({ example: 'password123', description: 'Mot de passe' })
    @IsNotEmpty({ message: 'Le mot de passe est requis' })
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;

}

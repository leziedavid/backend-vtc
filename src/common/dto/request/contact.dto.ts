import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class 
CreateContactDto {
    @ApiProperty({
        description: 'Nom et prénom de la personne',
        example: 'Jean Dupont',
    })
    @IsString()
    @MinLength(2)
    nomPrenom: string;

    @ApiProperty({
        description: 'Adresse email du contact',
        example: 'jean.dupont@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Numéro de téléphone du contact',
        example: '+22601020304',
    })
    @IsString()
    phone: string;

    @ApiProperty({
        description: "objet du message du contact",
        example: "besoin d'aide",
    })
    @IsString()
    objets: string;

    @ApiProperty({
        description: 'Message envoyé par le contact',
        example: 'Je souhaite acheter 10 tonnes de maïs bio.',
    })
    @IsString()
    @MinLength(10)
    contents: string;

    @ApiPropertyOptional({
        description: 'Source du formulaire de contact',
        example: 'contact_form_agricole',
        default: 'contact_form_agricole',
    })
    @IsOptional()
    @IsString()
    source?: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) { }



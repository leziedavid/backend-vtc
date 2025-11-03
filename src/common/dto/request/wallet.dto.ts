import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateWalletDto {
    @ApiProperty({ example: 'clx8g5ksl0000smv5v1v2t8pn', description: "Identifiant de l'utilisateur lié au portefeuille" })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiPropertyOptional({ example: 1500.5, description: 'Solde initial du portefeuille' })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional({ example: 'MOBILE_MONEY', description: 'Méthode de paiement par défaut', enum: PaymentMethod })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({ example: 'WAVE', description: 'Type de recharge par défaut' })
    @IsOptional()
    @IsString()
    rechargeType?: string;
}

export class UpdateWalletDto extends PartialType(CreateWalletDto) { }

export class WalletResponseDto {
    @ApiProperty({ example: 'clx8g9wxa0002smv6a2f3u1cd', description: "Identifiant unique du portefeuille" })
    id: string;

    @ApiProperty({ example: 1500.5, description: 'Solde du portefeuille' })
    amount: number;

    @ApiProperty({ example: 'clx8g5ksl0000smv5v1v2t8pn', description: "Identifiant de l'utilisateur propriétaire" })
    userId: string;

    @ApiProperty({ example: 'MOBILE_MONEY', description: 'Méthode de paiement par défaut', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty({ example: 'WAVE', description: 'Type de recharge (ex: WAVE)' })
    rechargeType: string;
}

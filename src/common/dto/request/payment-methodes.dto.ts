import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class PaymentMethodesDto {
    @ApiProperty({ example: 'uuid-payment' })
    id: string;

    @ApiProperty({ example: 'Orange Money' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo de la méthode de paiement' })
    @IsOptional()
    logo?: any;

    @ApiProperty({ enum: Status, example: Status.ACTIVE })
    @IsEnum(Status)
    status: Status;
}

export class CreatePaymentMethodesDto extends OmitType(PaymentMethodesDto, ['id'] as const) { }

export class UpdatePaymentMethodesDto extends PartialType(CreatePaymentMethodesDto) { }

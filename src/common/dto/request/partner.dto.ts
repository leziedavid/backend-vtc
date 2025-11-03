// partner.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/swagger';

export class PartnerDto {
    @ApiProperty({ example: 'uuid-partner-123' })
    id: string;

    @ApiProperty({ example: 'Transport SARL' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreatePartnerDto extends OmitType(PartnerDto, ['id'] as const) { }
export class UpdatePartnerDto extends PartialType(CreatePartnerDto) { }

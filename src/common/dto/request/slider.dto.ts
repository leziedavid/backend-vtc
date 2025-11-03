import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeFile } from '@prisma/client';

/* ---------------- SLIDER ---------------- */
export class SliderDto {
    @ApiProperty({ example: 'uuid-slider' })
    id: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: "Image du slider" })
    @IsOptional()
    image?: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;
}
export class CreateSliderDto extends OmitType(SliderDto, ['id'] as const) { }
export class UpdateSliderDto extends PartialType(CreateSliderDto) { }

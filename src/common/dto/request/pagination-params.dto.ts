// src/dto/request/pagination-params.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

export class PaginationParamsDto {
    @ApiPropertyOptional({ description: 'Page actuelle', default: 1 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Nombre d’éléments par page', default: 10 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number = 10;
}

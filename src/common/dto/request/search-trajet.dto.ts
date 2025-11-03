import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SearchTrajetDto {
    /** Nom ou lieu de départ */
    @IsOptional()
    depart?: string;

    /** Nom ou lieu de destination */
    @IsOptional()
    destination?: string;

    /** Latitude de départ (optionnelle si nom fourni) */
    @IsOptional()
    @IsNumber()
    departureLat?: number;

    /** Longitude de départ (optionnelle si nom fourni) */
    @IsOptional()
    @IsNumber()
    departureLng?: number;

    /** Latitude de destination (optionnelle si nom fourni) */
    @IsOptional()
    @IsNumber()
    destinationLat?: number;

    /** Longitude de destination (optionnelle si nom fourni) */
    @IsOptional()
    @IsNumber()
    destinationLng?: number;
}

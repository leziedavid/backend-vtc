// assign-driver.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AssignDriverDto {
    @ApiProperty({ description: 'ID du driver', required: false })
    driverId?: string;

    @ApiProperty({ description: 'Action à effectuer', enum: ['assign', 'remove'], default: 'assign' })
    action: 'assign' | 'remove' = 'assign';
}

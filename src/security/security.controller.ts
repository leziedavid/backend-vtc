import { Controller, Post, Get, Body, Query, Param, Req, BadRequestException, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { LoginByPhoneCode } from 'src/common/dto/request/loginByPhoneCode.dto';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('Security API')
@Controller('security')
export class SecurityController {
    constructor(private readonly securityService: SecurityService) {}

    /** --------------------- 🔑 Connexion par email ou téléphone --------------------- */
    @Post('login')
    @ApiOperation({ summary: 'Connexion via email ou téléphone', description: 'Permet à un utilisateur de se connecter via email ou téléphone et reçoit les tokens JWT (access + refresh).'
    })
    @ApiBody({ type: LoginByPhoneCode })
    @ApiResponse({ status: 200, description: 'Connexion réussie.' })
    async login(@Body() dto: LoginByPhoneCode) {
        if (!dto.login || !dto.password)
            throw new BadRequestException('Login et mot de passe requis');
        return this.securityService.loginByEmailOrPhone(dto);
    }

    /** --------------------- 🔁 Rafraîchir un token --------------------- */
    @Post('refresh')
    @ApiOperation({ summary: 'Rafraîchir le token JWT', description: 'Génère un nouveau token access à partir d’un refresh token valide.',})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5...' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès.' })
    async refreshToken(@Body('token') token: string) {
        if (!token) throw new BadRequestException('Token requis');
        return this.securityService.refreshToken(token);
    }

    /** --------------------- 🛒 Commandes de l'utilisateur --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('listes/orders/user')
    @ApiOperation({ summary: 'Lister les commandes de l’utilisateur connecté (paginé)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    async getUserOrders( @Req() req: Request, @Query() params: PaginationParamsDto,) {
        const user = req.user as any;
        return this.securityService.getUserOrders(user.id, params);
    }

    /** --------------------- 🏬 Commandes d’un partenaire ou chauffeur (ses trajets) --------------------- */
    @UseGuards(JwtAuthGuard)
    @Get('orders/partner-or-driver')
    @ApiOperation({ summary: 'Lister les commandes des trajets du partenaire ou chauffeur connecté (paginé)' })
    @ApiQuery({ name: 'role', required: true, example: 'PARTENAIRE', enum: ['PARTENAIRE', 'DRIVER'] })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiResponse({ status: 200, description: 'Commandes récupérées avec succès.' })
    async getOrdersByPartnerOrDriver( @Req() req: Request,  @Query('role') role: 'PARTENAIRE' | 'DRIVER', @Query() params: PaginationParamsDto, ) {
        const user = req.user as any;
        return this.securityService.getOrdersByPartner(user.id, role, params);
    }
}

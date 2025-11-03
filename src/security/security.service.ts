import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenericService } from '../utils/generic.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { BaseResponse } from 'src/utils/base-response';
import { LoginByPhoneCode } from 'src/common/dto/request/loginByPhoneCode.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FunctionService } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { User } from '@prisma/client';

@Injectable()
export class SecurityService {
    private generic: GenericService<User>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly functionService: FunctionService,
        private readonly localStorage: LocalStorageService, ) {
        this.generic = new GenericService<User>(prisma, 'user');
    }

    /** --------------------- Connexion --------------------- */
    async loginByEmailOrPhone(dto: LoginByPhoneCode): Promise<BaseResponse<any>> {
        const isEmail = /\S+@\S+\.\S+/.test(dto.login);

        const user = isEmail
            ? await this.prisma.user.findUnique({ where: { email: dto.login } })
            : await this.prisma.user.findUnique({ where: { phone: dto.login } });

        if (!user) return new BaseResponse(401, 'Utilisateur non trouvé');

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) return new BaseResponse(401, 'Mot de passe incorrect');



        // ✅ Vérifie si le compte est actif
        if (user.status !== 'ACTIVE') {
            return new BaseResponse(403, 'Votre compte n’est pas encore activé. Veuillez contacter l’administrateur.');
        }

        // ✅ Vérifie si l'utilisateur est lié à un partenaire
        let partnerId: string | null = null;
        if (user.partnerId) partnerId = user.partnerId;

        const file = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });
        const imageUrl = file ? getPublicFileUrl(file.fileUrl) : null;

        const payload = {
            sub: user.id,
            role: user.role,
            partnerId,
            name: user.name,
            email: user.email,
            imageUrl,
        };

        const access = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRE') || '24h',
        });
        const refresh = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRE') || '7d',
        });

        return new BaseResponse(200, 'Connexion réussie', {
            access_token: access,
            refresh_token: refresh,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                partnerId,
                imageUrl,
            },
        });
    }

    /** --------------------- Rafraîchir token --------------------- */
    async refreshToken(token: string): Promise<BaseResponse<{ access_token: string }>> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            const newAccessToken = this.jwtService.sign(payload, {
                expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRE') || '15m',
            });

            return new BaseResponse(200, 'Token rafraîchi', { access_token: newAccessToken });
        } catch {
            throw new UnauthorizedException('Refresh token invalide ou expiré');
        }
    }

    /** --------------------- Commandes d'un utilisateur (paginated) --------------------- */
    async getUserOrders(userId: string, params: PaginationParamsDto) {
        const data = await this.functionService.paginate({
            model: 'Commande',
            page: Number(params.page || 1),
            limit: Number(params.limit || 10),
            conditions: { userId },
            selectAndInclude: {
                select: null,
                include: {
                    trajet:{ include: { vehicle: true } },
                    user: true,
                    typeCommande: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Commandes de l’utilisateur récupérées', data);
    }

    /** ---------------------------------------------------------------------------
     * 📦 Récupération des commandes d’un partenaire ou d’un chauffeur
     * Si le rôle = PARTENAIRE → on récupère toutes les commandes des véhicules de sa flotte
     * Si le rôle = DRIVER → on récupère les commandes liées à ses trajets
     * --------------------------------------------------------------------------- */
    async getOrdersByPartner(userId: string, role: 'PARTENAIRE' | 'DRIVER', params: PaginationParamsDto) {
        let vehicleIds: string[] = [];

        if (role === 'PARTENAIRE') {
            // Récupérer les véhicules du partenaire
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { partner: true },
            });

            if (!user?.partnerId) {
                throw new BadRequestException("Aucun partenaire associé à cet utilisateur.");
            }

            const vehicles = await this.prisma.vehicle.findMany({
                where: { partnerId: user.partnerId },
                select: { id: true },
            });

            vehicleIds = vehicles.map(v => v.id);
        }
        else if (role === 'DRIVER') {
            // Récupérer les véhicules liés à ce chauffeur via relation N:N
            const vehicles = await this.prisma.vehicle.findMany({
                where: { drivers: { some: { id: userId } } }, // 🔹 Correct
                select: { id: true },
            });

            vehicleIds = vehicles.map(v => v.id);
        }
        else {
            throw new BadRequestException("Rôle non autorisé pour cette opération.");
        }

        // Récupérer les commandes liées à ces véhicules
        const data = await this.functionService.paginate({
            model: 'Commande',
            page: Number(params.page || 1),
            limit: Number(params.limit || 10),
            conditions: {
                trajet: {
                    vehicleId: { in: vehicleIds } // ✅ OK, filtre sur les trajets
                }
            },
            selectAndInclude: {
                select: null,
                include: {
                    user: true,
                    trajet: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Commandes récupérées', data);
    }

    /** --------------------- Commandes d’un partenaire (ses trajets) --------------------- */

    async getOrdersByPartner2(partnerId: string, params: PaginationParamsDto) {
        // Récupère les véhicules du partenaire
        const vehicles = await this.prisma.vehicle.findMany({ where: { partnerId } });
        const vehicleIds = vehicles.map(v => v.id);

        const data = await this.functionService.paginate({
            model: 'Commande',
            page: Number(params.page || 1),
            limit: Number(params.limit || 10),
            conditions: { trajet: { vehicleId: { in: vehicleIds } } },
            selectAndInclude: {
                select: null,
                include: {
                    user: true,
                    trajet: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Commandes du partenaire récupérées', data);
    }
}

// src/common/guards/user-or-token.guard.ts
import {CanActivate,ExecutionContext,Injectable,UnauthorizedException,NotFoundException,} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class UserOrTokenAuthGuard implements CanActivate { constructor( private prisma: PrismaService, private reflector: Reflector, private jwtService: JwtService,) { }

    
    async canActivate(context: ExecutionContext): Promise<boolean> {

        const request = context.switchToHttp().getRequest<Request>();
        const queryUserId = request.query.userId as string | undefined;
        const authHeader = request.headers['authorization'] || request.headers['Authorization'];

        const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        let userId = queryUserId;

        if (token) {
            try {
                const decoded = this.jwtService.verify(token);
                if (!decoded.sub) throw new UnauthorizedException('Token invalide');
                userId = decoded.sub;
            } catch (e) {
                throw new UnauthorizedException('Token invalide ou expiré');
            }
        }

        if (!userId) throw new UnauthorizedException('Token ou userId requis');

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        (request as any).user = user;

        return true;
    }

}

@Injectable()
export class UserOrTokenAuthGuard2 implements CanActivate {
    constructor(private prisma: PrismaService, private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const queryUserId = request.query.userId as string | undefined;

        // Récupérer le token dans les headers
        const authHeader = request.headers['authorization'] || request.headers['Authorization'];
        const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        let userId = queryUserId;
        
        console.log(token);

        if (token) {

            try {

                const secret = process.env.JWT_SECRET || 'ta_clé_secrète';
                const decoded = jwt.verify(token, secret) as { sub?: string };
                if (!decoded.sub) throw new UnauthorizedException('Token invalide');
                userId = decoded.sub;
            } catch (e) {
                throw new UnauthorizedException('Token invalide ou expiré');
            }
        }


        if (!userId) throw new UnauthorizedException('Token ou userId requis');

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        // Injecter l'utilisateur dans la requête
        (request as any).user = user;

        return true;
    }
}

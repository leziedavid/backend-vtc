import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { CommandeStatus } from '@prisma/client';
import { CreateCommandeDto, UpdateCommandeDto } from 'src/common/dto/request/commande.dto';

@Injectable()
export class CommandeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) { }

    /** 🆕 Créer une commande */
    /** 🆕 Créer une commande avec gestion du nombre de places */
    async create(dto: CreateCommandeDto & { userId: string }) {
        const trajet = await this.prisma.trajet.findUnique({ where: { id: dto.trajetId } });
        if (!trajet) throw new BadRequestException('Trajet introuvable');

        if (trajet.nbplaces <= 0) {
            throw new BadRequestException('Plus de places disponibles pour ce trajet');
        }

        // On décrémente le nombre de places disponibles
        await this.prisma.trajet.update({
            where: { id: dto.trajetId },
            data: { nbplaces: { decrement: 1 } },
        });

        const commande = await this.prisma.commande.create({
            data: {
                userId: dto.userId,
                trajetId: dto.trajetId,
                typeId: dto.typeId,
                price: dto.price,
                status: CommandeStatus.PENDING,
            },
        });

        return new BaseResponse(201, 'Commande créée avec succès', commande);
    }

    /** ✏️ Mettre à jour une commande */
    async update(id: string, dto: UpdateCommandeDto) {
        const existing = await this.prisma.commande.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Commande introuvable');

        const updated = await this.prisma.commande.update({
            where: { id },
            data: dto,
        });

        return new BaseResponse(200, 'Commande mise à jour avec succès', updated);
    }

    /** 🗑️ Supprimer une commande */
    async delete(id: string) {
        const existing = await this.prisma.commande.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Commande introuvable');

        await this.prisma.commande.delete({ where: { id } });
        return new BaseResponse(200, 'Commande supprimée avec succès');
    }

    /** 🔄 Mettre à jour le statut d’une commande */
    async updateStatus(id: string, status: CommandeStatus) {
        const existing = await this.prisma.commande.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Commande introuvable');

        const updated = await this.prisma.commande.update({
            where: { id },
            data: { status },
        });

        return new BaseResponse(200, 'Statut mis à jour avec succès', updated);
    }

    /** 🔍 Récupérer une commande par ID */
    async findOne(id: string) {
        const commande = await this.prisma.commande.findUnique({
            where: { id },
            include: {
                user: true,
                trajet: true,
                typeCommande: true,
            },
        });

        if (!commande) throw new NotFoundException('Commande introuvable');
        return new BaseResponse(200, 'Commande trouvée', commande);
    }

    /** 📋 Liste complète (non paginée) */
    async findAll() {
        const commandes = await this.prisma.commande.findMany({
            include: {
                user: true,
                trajet: true,
                typeCommande: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste de toutes les commandes', commandes);
    }

    /** 📄 Liste paginée */
    async findPaginated(params: PaginationParamsDto) {
        const data = await this.functionService.paginate({
            model: 'Commande',
            page: Number(params.page || 1),
            limit: Number(params.limit || 10),
            selectAndInclude: {
                select: null,
                include: {
                    user: true,
                    trajet: true,
                    typeCommande: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste paginée des commandes', data);
    }

    /** 👤 Commandes d’un utilisateur donné */
    async findByUser(userId: string) {
        const commandes = await this.prisma.commande.findMany({
            where: { userId },
            include: {
                trajet: {
                    include: {
                        driver: true,
                        vehicle: true,
                    },
                },
                typeCommande: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return new BaseResponse(200, 'Liste des commandes de l’utilisateur', commandes);
    }

    /** ✅ Validation d’une commande (chauffeur) */
    async validateCommande(driverId: string, commandeId: string) {
        const commande = await this.prisma.commande.findUnique({
            where: { id: commandeId },
            include: { trajet: true },
        });
        if (!commande) throw new BadRequestException('Commande introuvable');

        if (commande.trajet.driverId !== driverId) {
            throw new BadRequestException('Vous ne pouvez pas valider cette commande');
        }

        if (commande.status !== CommandeStatus.PENDING) {
            throw new BadRequestException('Cette commande ne peut pas être validée');
        }

        const updated = await this.prisma.commande.update({
            where: { id: commandeId },
            data: { status: CommandeStatus.CONFIRMED },
        });

        return new BaseResponse(200, 'Commande validée avec succès', updated);
    }

    /** ❌ Annulation d’une commande avec gestion du nombre de places */
    async cancelCommande(userId: string, role: 'USER' | 'DRIVER', commandeId: string) {
        const commande = await this.prisma.commande.findUnique({
            where: { id: commandeId },
            include: { trajet: true },
        });
        if (!commande) throw new BadRequestException('Commande introuvable');

        if (
            commande.status === CommandeStatus.STARTED ||
            commande.status === CommandeStatus.COMPLETED
        ) {
            throw new BadRequestException("Impossible d'annuler une commande déjà démarrée ou terminée");
        }

        let updated;

        // Chauffeur
        if (role === 'DRIVER') {
            if (commande.trajet.driverId !== userId) {
                throw new BadRequestException("Vous n'êtes pas le chauffeur de ce trajet");
            }

            if (commande.status !== CommandeStatus.CONFIRMED) {
                throw new BadRequestException("Vous ne pouvez pas annuler cette commande");
            }

            updated = await this.prisma.commande.update({
                where: { id: commandeId },
                data: { status: CommandeStatus.CANCELLED },
            });

            // Incrémenter le nombre de places disponibles
            await this.prisma.trajet.update({
                where: { id: commande.trajetId },
                data: { nbplaces: { increment: 1 } },
            });

            return new BaseResponse(200, 'Commande annulée par le chauffeur', updated);
        }

        // Client
        updated = await this.prisma.commande.update({
            where: { id: commandeId },
            data: { status: CommandeStatus.CANCELLED },
        });

        // Incrémenter le nombre de places disponibles
        await this.prisma.trajet.update({
            where: { id: commande.trajetId },
            data: { nbplaces: { increment: 1 } },
        });

        return new BaseResponse(200, 'Commande annulée par le client', updated);
    }

    /** 🚀 Démarrer une commande */
    async startCommande(driverId: string, commandeId: string) {
        const commande = await this.prisma.commande.findUnique({
            where: { id: commandeId },
            include: { trajet: true },
        });
        if (!commande) throw new BadRequestException('Commande introuvable');

        if (commande.trajet.driverId !== driverId) {
            throw new BadRequestException('Vous ne pouvez pas démarrer cette commande');
        }

        if (commande.status !== CommandeStatus.CONFIRMED) {
            throw new BadRequestException('Seules les commandes confirmées peuvent être démarrées');
        }

        const updated = await this.prisma.commande.update({
            where: { id: commandeId },
            data: { status: CommandeStatus.STARTED },
        });

        return new BaseResponse(200, 'Commande démarrée avec succès', updated);
    }

    /** 🏁 Terminer une commande */
    async completeCommande(driverId: string, commandeId: string) {
        const commande = await this.prisma.commande.findUnique({
            where: { id: commandeId },
            include: { trajet: true },
        });
        if (!commande) throw new BadRequestException('Commande introuvable');

        if (commande.trajet.driverId !== driverId) {
            throw new BadRequestException('Vous ne pouvez pas terminer cette commande');
        }

        if (commande.status !== CommandeStatus.STARTED) {
            throw new BadRequestException('Cette commande ne peut pas être terminée');
        }

        const updated = await this.prisma.commande.update({
            where: { id: commandeId },
            data: { status: CommandeStatus.COMPLETED },
        });

        return new BaseResponse(200, 'Commande terminée avec succès', updated);
    }
}

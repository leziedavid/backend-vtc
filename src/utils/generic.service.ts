import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class GenericService<T> {
    constructor(
        private readonly prisma: PrismaService,
        private readonly modelName: keyof PrismaClient, // ex: 'product', 'user', 'booking'
    ) { }

    /** ---------- CRUD GÉNÉRIQUE ---------- */

    async create(data: Prisma.Prisma__Pick<T, any>): Promise<T> {
        try {
            return await (this.prisma[this.modelName] as any).create({ data });
        } catch (error) {
            console.error('Erreur create :', error);
            throw new InternalServerErrorException('Erreur lors de la création');
        }
    }

    async findOne(where: any, include?: any): Promise<T> {
        const entity = await (this.prisma[this.modelName] as any).findUnique({ where, include });
        if (!entity) throw new NotFoundException(`${String(this.modelName)} introuvable`);
        return entity;
    }

    async findAll(where?: any, include?: any): Promise<T[]> {
        return await (this.prisma[this.modelName] as any).findMany({ where, include });
    }

    async update(where: any, data: any): Promise<T> {
        try {
            return await (this.prisma[this.modelName] as any).update({ where, data });
        } catch (error) {
            console.error('Erreur update :', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async delete(where: any): Promise<T> {
        try {
            return await (this.prisma[this.modelName] as any).delete({ where });
        } catch (error) {
            console.error('Erreur delete :', error);
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }

        // ---------- Ajout de deleteMany ----------
    async deleteMany(where: any): Promise<{ count: number }> {
        try {
            return await (this.prisma[this.modelName] as any).deleteMany({ where });
        } catch (error) {
            console.error('Erreur deleteMany :', error);
            throw new InternalServerErrorException('Erreur lors de la suppression multiple');
        }
    }
        /** ---------- Nouvelle méthode avec OR / AND ---------- */
    async findFirst(where: any, include?: any): Promise<T> {
        const entity = await (this.prisma[this.modelName] as any).findFirst({ where, include });
        if (!entity) throw new NotFoundException(`${String(this.modelName)} introuvable`);
        return entity;
    }

}

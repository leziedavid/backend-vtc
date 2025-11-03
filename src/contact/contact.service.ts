import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateContactDto, UpdateContactDto } from 'src/common/dto/request/contact.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/utils/base-response';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class ContactService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) {}

    // Pagination
    async getAllPaginate(page: number, limit: number): Promise<BaseResponse<any>> {
        try {
            const paginateOptions: PaginateOptions = {
                model: 'Contact',
                page: Number(page),
                limit: Number(limit),
                selectAndInclude: {
                    select: null,
                    include: {},
                },
                orderBy: { timestamp: 'desc' },
            };

            const data = await this.functionService.paginate(paginateOptions);
            return new BaseResponse(200, 'Liste paginée des contacts', data);
        } catch (error) {
            console.error('Erreur lors de la récupération des contacts :', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des contacts');
        }
    }

    // Liste complète
    async findAll(): Promise<BaseResponse<any>> {
        const data = await this.prisma.contact.findMany({
            orderBy: { timestamp: 'desc' },
        });
        return new BaseResponse(200, 'Liste des contacts', data);
    }

    // Trouver un contact
    async findOne(id: string): Promise<BaseResponse<any>> {
        const item = await this.prisma.contact.findUnique({ where: { id } });
        if (!item) throw new NotFoundException('Contact non trouvé');
        return new BaseResponse(200, 'Contact trouvé', item);
    }

    // Créer un contact
    async create(dto: CreateContactDto): Promise<BaseResponse<any>> {
        try {
            const created = await this.prisma.contact.create({
                data: {
                    nomPrenom: dto.nomPrenom,
                    email: dto.email,
                    phone: dto.phone,
                    objets: dto.objets,
                    contents: dto.contents,
                    source: dto.source ?? 'contact_form_agricole',
                },
            });
            return new BaseResponse(201, 'Contact créé avec succès', created);
        } catch (error) {
            console.error('Erreur lors de la création du contact :', error);
            throw new InternalServerErrorException('Erreur lors de la création');
        }
    }

    // Mise à jour
    async update(id: string, dto: UpdateContactDto): Promise<BaseResponse<any>> {
        try {
            const existing = await this.prisma.contact.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('Contact non trouvé');

            const updated = await this.prisma.contact.update({
                where: { id },
                data: { ...dto },
            });

            return new BaseResponse(200, 'Contact mis à jour', updated);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    // Suppression
    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.contact.delete({ where: { id } });
            return new BaseResponse(200, 'Contact supprimé', null);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Contact non trouvé');
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}

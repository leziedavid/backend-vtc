import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { GenericService } from '../utils/generic.service';
import { CreateUserDto, UpdateUserDto } from 'src/common/dto/request/user.dto';
import { BaseResponse } from 'src/utils/base-response';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    private generic: GenericService<User>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,
    ) {
        this.generic = new GenericService<User>(prisma, 'user');
    }

    /** --------------------- Création utilisateur --------------------- */
    async create(dto: CreateUserDto): Promise<BaseResponse<User>> {
        const { password, images, ...allData } = dto as any;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userStatus = allData.role !== 'ADMIN' ? 'INACTIVE' : 'ACTIVE';

            // verifier qsi l'eamail exite
            const emailExist = await this.prisma.user.findUnique({ where: { email: allData.email } });
            if (emailExist) throw new BadRequestException('Email déjà utilisé');

            // 1️⃣ Création de l'utilisateur
            const user = await this.generic.create({
                ...allData,
                password: hashedPassword,
                status: userStatus,
            });


            // 2️⃣ Upload des images si présentes
            if (images?.length) {
                for (const file of images) {
                    await this.uploadFile(user.id, file.buffer, 'userMain', 'users');
                }
            }

            // 3️⃣ Création automatique du wallet
            await this.prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 0,
                    paymentMethod: 'MOBILE_MONEY',
                    rechargeType: 'WAVE',
                },
            });

            // 4️⃣ Création du Partner si rôle = PARTENAIRE
            if (allData.role === 'PARTENAIRE') {
                await this.prisma.partner.create({
                    data: {
                        name: user.name,
                        users: { connect: { id: user.id } },
                    },
                });
            }

            return new BaseResponse(201, 'Utilisateur créé avec succès', user);

        } catch (error) {
            // ✅ Si c’est une erreur NestJS (BadRequestException, NotFoundException, etc.), on la relance telle quelle
            if (error instanceof BadRequestException) throw error;
            console.error('[UserService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la création de l’utilisateur');
        }
    }

    /** --------------------- Mise à jour utilisateur --------------------- */
    async update(id: string, dto: UpdateUserDto): Promise<BaseResponse<User>> {
        const { images, ...allData } = dto as any;

        const user = await this.generic.findOne({ id });
        if (!user) throw new BadRequestException('Utilisateur introuvable');

        try {
            const updatedUser = await this.generic.update({ id }, allData);

            if (images?.length) {
                for (const file of images) {
                    await this.uploadFile(user.id, file.buffer, 'userMain', 'users');
                }
            }

            return new BaseResponse(200, 'Utilisateur mis à jour avec succès', updatedUser);
        } catch (error) {
            // ✅ Si c’est une erreur NestJS (BadRequestException, NotFoundException, etc.), on la relance telle quelle
            if (error instanceof BadRequestException) throw error;
            console.error('[UserService.create] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour de l’utilisateur');
        }
    }

    /** --------------------- Récupérer un utilisateur --------------------- */
    // Version allégée avec seulement les données essentielles
    async findOneLight(id: string): Promise<BaseResponse<User>> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true
                    }
                },
                driverTrajets: {
                    take: 5, // Limiter à 5 derniers trajets
                    orderBy: { createdAt: 'desc' },
                    include: {
                        vehicle: {
                            include: {
                                type: true
                            }
                        }
                    }
                },
                vehicles: {
                    include: {
                        type: true,
                        partner: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                wallet: {
                    select: {
                        id: true,
                        balance: true,
                        paymentMethod: true
                    }
                }
            }
        });

        if (!user) {
            throw new BadRequestException('Utilisateur introuvable');
        }

        // Récupérer uniquement la première image
        const userFile = await this.prisma.fileManager.findFirst({
            where: {
                targetId: user.id,
                fileType: 'userFiles'
            },
            orderBy: { createdAt: 'desc' },
        });

        const userWithImage = {
            ...user,
            image: userFile ? getPublicFileUrl(userFile.fileUrl) : null
        };

        return new BaseResponse(200, 'Utilisateur trouvé', userWithImage);
    }

    /** --------------------- Pagination utilisateurs --------------------- */
    async getAllPaginate(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'User',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        wallet: true,
                        // addresses: true,
                        // abonnements: true,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const userIds = data.data.map(u => u.id);

            const allFiles = await this.prisma.fileManager.findMany({
                where: { targetId: { in: userIds }, fileType: 'userFiles' },
                orderBy: { createdAt: 'desc' },
            });

            const filesMap: Record<string, string> = {};
            for (const file of allFiles) {
                if (!filesMap[file.targetId]) {
                    filesMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            const usersWithFiles = data.data.map(user => ({
                ...user,
                photo: filesMap[user.id] || null,
            }));

            return new BaseResponse(200, 'Liste paginée des utilisateurs', {
                ...data,
                data: usersWithFiles,
            });
        } catch (error) {
            console.error('[UserService.getAllPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des utilisateurs');
        }
    }


    /** --------------------- Récupération de tous les drivers pour un utilisateur partenaire --------------------- */
    async fetchAllDriversForPartners(userId: string): Promise<BaseResponse<any>> {

        if (!userId) {
            throw new BadRequestException('Aucun utilisateur partenaire fourni');
        }

        try {
            // 🔹 1️⃣ Récupération du partenaire
            const partner = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    vehicles: { include: { type: true } },
                },
            });

            if (!partner) {
                return new BaseResponse(404, 'Partenaire introuvable', []);
            }

            // 🔹 2️⃣ Récupération des drivers liés à ce partenaire
            const drivers = await this.prisma.user.findMany({
                where: { role: 'DRIVER', partnerId: partner.partnerId },
                include: { vehicles: { include: { type: true } } },
            });

            // 🔹 3️⃣ Récupération des fichiers des drivers
            const allIds = [partner.id, ...drivers.map(d => d.id)];
            const allFiles = await this.prisma.fileManager.findMany({
                where: { targetId: { in: allIds }, fileType: 'userFiles' },
                orderBy: { createdAt: 'desc' },
            });

            const filesMap: Record<string, string> = {};
            for (const file of allFiles) {
                if (!filesMap[file.targetId]) {
                    filesMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            // 🔹 4️⃣ Fusion des drivers et du partenaire avec leurs photos
            const driversWithFiles = drivers.map(driver => ({
                ...driver,
                photo: filesMap[driver.id] || null,
            }));

            const partnerWithPhoto = { ...partner, photo: filesMap[partner.id] || null };

            // 🔹 5️⃣ Retourner la liste : si aucun driver trouvé, on retourne juste le partenaire
            const resultList = driversWithFiles.length ? [partnerWithPhoto, ...driversWithFiles] : [partnerWithPhoto];

            return new BaseResponse(200, 'Liste des drivers pour le partenaire', resultList);
        } catch (error) {
            console.error('[UserService.fetchAllDriversForPartners] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des drivers');
        }

    }

    /** --------------------- Pagination des drivers pour un utilisateur partenaire --------------------- */
    async fetchAllDriversForPartnersPaginate(userId: string, params: PaginationParamsDto,): Promise<BaseResponse<any>> {

        if (!userId) {
            throw new BadRequestException('Aucun utilisateur partenaire fourni');
        }

        try {
            // 🔹 1️⃣ Vérifier que le partenaire existe
            const partner = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    vehicles: { include: { type: true } },
                },
            });

            if (!partner) {
                return new BaseResponse(404, 'Partenaire introuvable', []);
            }

            // ⚠️ Prisma n’autorise pas `select` et `include` ensemble.
            // Donc on sépare le `select` dans une première requête légère (via paginate),
            // puis on enrichit les résultats avec les `include` (relations) après.

            const baseData = await this.functionService.paginate<PaginateOptions>({
                model: 'User',
                page: params.page,
                limit: params.limit,
                // Nouveau
                conditions: {
                    role: 'DRIVER',
                    partnerId: partner.partnerId,
                },
                selectAndInclude: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        partnerId: true,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            console.log("🔹 resultat", baseData);

            // 🔹 2️⃣ On enrichit manuellement les relations "vehicles" et "type"
            const userIds = baseData.data.map((u) => u.id);
            const usersWithRelations = await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                include: {
                    vehicles: {
                        include: {
                            type: { select: { id: true, name: true } },
                        },
                    },
                },
            });

            // 🔹 3️⃣ Fusionner les données paginées + relations
            const mergedData = baseData.data.map((user) => {
                const fullUser = usersWithRelations.find((u) => u.id === user.id);
                return {
                    ...user,
                    vehicles: fullUser?.vehicles || [],
                };
            });

            // 🔹 4️⃣ Récupération des fichiers (photos)
            const allFiles = await this.prisma.fileManager.findMany({
                where: { targetId: { in: userIds }, fileType: 'userFiles' },
                orderBy: { createdAt: 'desc' },
            });

            const filesMap: Record<string, string> = {};
            for (const file of allFiles) {
                if (!filesMap[file.targetId]) {
                    filesMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            // 🔹 5️⃣ Ajouter les images aux utilisateurs
            const formattedData = mergedData.map((user) => ({
                ...user,
                image: filesMap[user.id] || null,
            }));

            // 🔹 6️⃣ Retour final
            return new BaseResponse(200, 'Liste paginée des drivers', {
                ...baseData,
                data: formattedData,
            });
        } catch (error) {
            console.error('[UserService.fetchAllDriversForPartnersPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des drivers');
        }
    }


    /** --------------------- Supprimer utilisateur --------------------- */
    async delete(id: string): Promise<BaseResponse<User>> {
        const user = await this.generic.findOne({ id });
        if (!user) throw new BadRequestException('Utilisateur introuvable');

        try {
            await this.generic.delete({ id });
            await this.prisma.fileManager.deleteMany({ where: { targetId: id } });
            return new BaseResponse(200, 'Utilisateur supprimé avec succès', user);
        } catch (error) {
            console.error('[UserService.delete] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression de l’utilisateur');
        }
    }

    /** --------------------- Mise à jour du statut utilisateur --------------------- */
    async updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'): Promise<BaseResponse<User>> {
        const user = await this.generic.findOne({ id: userId });
        if (!user) throw new BadRequestException('Utilisateur introuvable');

        try {
            const updated = await this.generic.update({ id: userId }, { status });
            return new BaseResponse(200, `Statut de l'utilisateur mis à jour vers ${status}`, updated);
        } catch (error) {
            console.error('[UserService.updateUserStatus] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du statut de l’utilisateur');
        }
    }

    /** --------------------- Upload fichier --------------------- */
    private async uploadFile(userId: string, fileBuffer: Buffer | string, fileType: string, folder: string) {
        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: userId, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.localStorage.deleteFile(existingFile.fileCode);
            } catch (err) {
                console.warn(`Erreur suppression du fichier ${existingFile.fileCode}: ${err.message}`);
            }
            await this.prisma.fileManager.deleteMany({ where: { targetId: userId, fileType } });
        }

        const uploadResult = await this.localStorage.saveFile(fileBuffer, folder);
        await this.prisma.fileManager.create({
            data: { ...uploadResult, fileType, targetId: userId },
        });
    }

    /** --------------------- Récupération des images --------------------- */
    async getUserImages(userId: string): Promise<{ main?: string; others?: string[] }> {
        const main = await this.prisma.fileManager.findFirst({ where: { targetId: userId, fileType: 'userMain' } });
        const others = await this.prisma.fileManager.findMany({ where: { targetId: userId, fileType: 'userOther' } });

        return {
            main: main ? getPublicFileUrl(main.fileUrl) : null,
            others: others.map(f => getPublicFileUrl(f.fileUrl)),
        };
    }
}

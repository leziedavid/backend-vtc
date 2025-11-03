import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Doshuffle } from './utils';

export type PaginateOptions = {
  model: Prisma.ModelName;
  page: number;
  limit: number;
  /** 🧩 Plus souple que Prisma.SelectAndInclude */
  selectAndInclude?: {
    select?: Record<string, any>;
    include?: Record<string, any>;
  };
  conditions?: Record<string, any>;
  orderBy?: Record<string, any>;
  shuffle?: boolean;
  fileTypeListes?: string[];
  /** 🟢 Inclure le nombre total d’éléments trouvés (avant pagination) */
  includeTotalElements?: boolean;
};

@Injectable()
export class FunctionService {
  constructor(private readonly prisma: PrismaService) { }

  /** 🔄 Enrichit chaque entité avec ses fichiers */
  private async enrichWithFiles(entity: any, fileTypeListes: string[]): Promise<any> {
    if (!fileTypeListes?.length) return { ...entity, files: [] };

    const files = await this.prisma.fileManager.findMany({
      where: {
        targetId: entity.id,
        fileType: { in: fileTypeListes },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { ...entity, files };
  }

  /** 📄 Pagination générique avec sécurité renforcée */
  async paginate<T>({
    model,
    page,
    limit,
    selectAndInclude,
    conditions,
    orderBy,
    shuffle,
    fileTypeListes,
    includeTotalElements = false,
  }: PaginateOptions) {
    const skip = page > 0 ? (page - 1) * limit : 0;
    const take = typeof limit === 'number' && limit > 0 ? limit : 10;

    // 🔹 Nombre total de pages / pagination
    const total = await this.prisma[model].count({
      where: { ...conditions },
    });

    // 🔹 Nombre total d’éléments correspondant aux conditions (optionnel)
    let totalElements: number | undefined;
    if (includeTotalElements) {
      totalElements = await this.prisma[model].count({
        where: { ...conditions },
      });
    }

    let data = await this.prisma[model].findMany({
      skip,
      take,
      where: { ...conditions },
      orderBy: { ...orderBy },
      ...(selectAndInclude || {}),
    });

    // 🔹 Supprimer le password après récupération si c'est un User
    if (model === 'User') {
      data = data.map(({ password, ...rest }) => rest);
    }

    if (shuffle) data = Doshuffle(data);

    // 🔄 Enrichir avec les fichiers si demandé
    if (fileTypeListes?.length) {
      data = await Promise.all(data.map((item) => this.enrichWithFiles(item, fileTypeListes)));
    }

    return {
      status: true,
      total,
      page,
      limit,
      data,
      ...(includeTotalElements ? { totalElements } : {}),
    };
  }

  /** 🔍 Recherche intelligente */
  async search<T>({
    model,
    search,
    limit,
    selectAndInclude,
    conditions,
    wheres,
  }: {
    model: Prisma.ModelName;
    search: string;
    limit: number;
    selectAndInclude?: Prisma.SelectAndInclude;
    conditions?: Record<string, any>;
    wheres: string[];
  }) {
    const queries = wheres.map((key) => ({
      [key]: {
        contains: search,
        mode: 'insensitive',
      },
    }));

    if (!search) return { limit, data: [] };

    let data = await this.prisma[model].findMany({
      take: Math.min(limit, 15),
      where: {
        OR: queries,
        ...conditions,
      },
      ...(selectAndInclude || {}),
    });

    // 🔹 Supprimer le password après récupération si c'est un User
    if (model === 'User') {
      data = data.map(({ password, ...rest }) => rest);
    }

    return { limit, data };
  }
}

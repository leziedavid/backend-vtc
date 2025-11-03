// utils/paginate-data.ts

export interface PaginateResult<T> {
    status: boolean;
    total: number;
    page: number;
    limit: number;
    data: T[];
}

/**
 * Transforme les résultats paginés en format front.
 * @param data - Les données récupérées depuis la DB
 * @param total - Nombre total d'éléments
 * @param page - Page actuelle
 * @param limit - Nombre d'éléments par page
 * @returns Objet paginé formaté pour le front
 */
export function paginateData<T>(data: T[], total: number, page: number = 1, limit: number = 10): PaginateResult<T> {
    return {
        status: true,
        total,
        page,
        limit,
        data,
    };
}

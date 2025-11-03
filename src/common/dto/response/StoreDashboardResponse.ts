// src/common/dto/response/StoreDashboardResponse.ts

/**
 * Interface représentant un avis d'utilisateur sur un produit
 */
export interface Rating {
  id: string;           // ID du rating
  rating: number;       // Note (ex: 1 à 5)
  review: string;       // Commentaire de l'utilisateur
  user: {
    id: string;
    name: string;
    image?: string;     // URL de l'image de l'utilisateur
  };
  productId: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
}

/**
 * Interface représentant le tableau de bord d'une boutique
 */
export interface StoreDashboardResponse {
  ratings: Rating[];
  totalOrders: number;
  totalEarnings: number;
  totalProducts: number;
}

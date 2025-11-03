/**
 * Service de notification WhatsApp
 * Gère l'envoi de notifications WhatsApp aux clients
 */

// Types pour une meilleure sécurité de type
export interface NotificationPayload {
    phoneNumber: string;
    status: NotificationStatus;
    message: string;
    templateData?: Record<string, any>;
}

export enum NotificationStatus {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
    PENDING = 'pending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface NotificationResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
}

// Configuration WhatsApp Business API
const WHATSAPP_CONFIG = {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
};

/**
 * Valide le numéro de téléphone au format international
 * @param phoneNumber - Numéro de téléphone à valider
 * @returns true si le numéro est valide
 */
function validatePhoneNumber(phoneNumber: string): boolean {
    // Supprime tous les caractères non numériques sauf le +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Vérifie le format international (commence par + et contient 10-15 chiffres)
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(cleanNumber);
}

/**
 * Nettoie et formate le numéro de téléphone
 * @param phoneNumber - Numéro de téléphone brut
 * @returns Numéro formaté ou null si invalide
 */
function formatPhoneNumber(phoneNumber: string): string | null {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Ajoute le + si manquant et commence par un chiffre
    if (!cleanNumber.startsWith('+') && /^\d/.test(cleanNumber)) {
        cleanNumber = '+' + cleanNumber;
    }

    return validatePhoneNumber(cleanNumber) ? cleanNumber : null;
}

/**
 * Génère un template de message basé sur le statut
 * @param status - Statut de la notification
 * @param message - Message personnalisé
 * @returns Message formaté
 */
function generateMessageTemplate(status: NotificationStatus, message: string): string {
    const statusEmojis = {
        [NotificationStatus.SUCCESS]: '✅',
        [NotificationStatus.ERROR]: '❌',
        [NotificationStatus.WARNING]: '⚠️',
        [NotificationStatus.INFO]: 'ℹ️',
        [NotificationStatus.PENDING]: '⏳',
        [NotificationStatus.COMPLETED]: '🎉',
        [NotificationStatus.CANCELLED]: '🚫'
    };

    const emoji = statusEmojis[status] || 'ℹ️';
    return `${emoji} *${status.toUpperCase()}*\n\n${message}`;
}

/**
 * Envoie une notification WhatsApp
 * @param payload - Données de la notification
 * @returns Promesse avec la réponse de l'envoi
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResponse> {
    try {
        // Validation des variables d'environnement
        if (!WHATSAPP_CONFIG.phoneNumberId || !WHATSAPP_CONFIG.accessToken) {
            throw new Error('Configuration WhatsApp manquante. Vérifiez vos variables d\'environnement.');
        }

        // Validation et formatage du numéro de téléphone
        const formattedPhone = formatPhoneNumber(payload.phoneNumber);
        if (!formattedPhone) {
            throw new Error(`Numéro de téléphone invalide: ${payload.phoneNumber}`);
        }

        // Validation du message
        if (!payload.message.trim()) {
            throw new Error('Le message ne peut pas être vide');
        }

        // Génération du message final
        const finalMessage = generateMessageTemplate(payload.status, payload.message);

        // Préparation des données pour l'API WhatsApp
        const whatsappPayload = {
            messaging_product: 'whatsapp',
            to: formattedPhone.replace('+', ''),
            type: 'text',
            text: {
                preview_url: false,
                body: finalMessage
            }
        };

        // Envoi de la requête à l'API WhatsApp
        const response = await fetch(
            `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(whatsappPayload)
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(
                responseData.error?.message ||
                `Erreur API WhatsApp: ${response.status} ${response.statusText}`
            );
        }

        // Log de succès (en développement seulement)
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Notification WhatsApp envoyée avec succès:', {
                messageId: responseData.messages?.[0]?.id,
                to: formattedPhone,
                status: payload.status
            });
        }

        return {
            success: true,
            messageId: responseData.messages?.[0]?.id,
            timestamp: new Date()
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

        // Log d'erreur (en développement seulement)
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erreur lors de l\'envoi de la notification WhatsApp:', {
                error: errorMessage,
                phoneNumber: payload.phoneNumber,
                status: payload.status
            });
        }

        return {
            success: false,
            error: errorMessage,
            timestamp: new Date()
        };
    }
}

/**
 * Envoie plusieurs notifications en lot (avec limitation de débit)
 * @param notifications - Liste des notifications à envoyer
 * @param delayMs - Délai entre chaque envoi (défaut: 1000ms)
 * @returns Promesse avec les résultats de tous les envois
 */
export async function sendBulkNotifications(
    notifications: NotificationPayload[],
    delayMs: number = 1000
): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    for (let i = 0; i < notifications.length; i++) {
        const result = await sendNotification(notifications[i]);
        results.push(result);

        // Délai entre les envois pour éviter la limitation de débit
        if (i < notifications.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Utilitaires pour des messages prédéfinis
 */
export const MessageTemplates = {
    orderConfirmed: (orderNumber: string) =>
        `Votre commande #${orderNumber} a été confirmée avec succès. Nous préparons votre commande.`,

    orderShipped: (orderNumber: string, trackingNumber?: string) =>
        `Bonne nouvelle ! Votre commande #${orderNumber} a été expédiée.${trackingNumber ? ` Numéro de suivi: ${trackingNumber}` : ''}`,

    orderDelivered: (orderNumber: string) =>
        `Votre commande #${orderNumber} a été livrée avec succès. Merci pour votre confiance !`,

    paymentReceived: (amount: string, currency: string = 'FCFA') =>
        `Nous avons bien reçu votre paiement de ${amount} ${currency}. Transaction confirmée.`,

    appointmentReminder: (date: string, time: string) =>
        `Rappel : Vous avez un rendez-vous prévu le ${date} à ${time}. À bientôt !`,
};

// Export par défaut
export default {
    sendNotification,
    sendBulkNotifications,
    MessageTemplates,
    NotificationStatus
};
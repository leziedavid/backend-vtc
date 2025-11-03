/**
 * Service de notification WhatsApp - Méthodes alternatives
 * Support pour plusieurs fournisseurs d'API WhatsApp
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
    provider?: string;
}

// Configuration pour différents fournisseurs
export enum WhatsAppProvider {
    TWILIO = 'twilio',
    ULTRAMSG = 'ultramsg',
    WHATSAPP_WEB_JS = 'whatsapp-web-js',
    CALLMEBOT = 'callmebot',
    WAPI = 'wapi',
    GREEN_API = 'green-api'
}

// Configuration multi-fournisseur
const PROVIDERS_CONFIG = {
    // Option 1: Twilio WhatsApp API (Recommandé - Professionnel)
    [WhatsAppProvider.TWILIO]: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_WHATSAPP_FROM, // Ex: whatsapp:+14155238886
        apiUrl: 'https://api.twilio.com/2010-04-01/Accounts'
    },

    // Option 2: UltraMsg API (Simple et économique)
    [WhatsAppProvider.ULTRAMSG]: {
        token: process.env.ULTRAMSG_TOKEN,
        instanceId: process.env.ULTRAMSG_INSTANCE_ID,
        apiUrl: 'https://api.ultramsg.com'
    },

    // Option 3: Green API (Populaire)
    [WhatsAppProvider.GREEN_API]: {
        idInstance: process.env.GREEN_API_ID_INSTANCE,
        apiTokenInstance: process.env.GREEN_API_TOKEN,
        apiUrl: 'https://api.green-api.com/waInstance'
    },

    // Option 4: CallMeBot (Gratuit mais limité)
    [WhatsAppProvider.CALLMEBOT]: {
        apiKey: process.env.CALLMEBOT_API_KEY,
        apiUrl: 'https://api.callmebot.com/whatsapp.php'
    },

    // Option 5: WAPI.js
    [WhatsAppProvider.WAPI]: {
        token: process.env.WAPI_TOKEN,
        apiUrl: process.env.WAPI_URL || 'https://wapi.green-api.com'
    }
};

/**
 * Valide le numéro de téléphone au format international
 */
function validatePhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(cleanNumber);
}

/**
 * Formate le numéro de téléphone selon le fournisseur
 */
function formatPhoneNumber(phoneNumber: string, provider: WhatsAppProvider): string | null {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    if (!cleanNumber.startsWith('+') && /^\d/.test(cleanNumber)) {
        cleanNumber = '+' + cleanNumber;
    }

    if (!validatePhoneNumber(cleanNumber)) return null;

    // Formatage spécifique par fournisseur
    switch (provider) {
        case WhatsAppProvider.TWILIO:
            return `whatsapp:${cleanNumber}`;
        case WhatsAppProvider.ULTRAMSG:
        case WhatsAppProvider.GREEN_API:
            return cleanNumber.replace('+', '') + '@c.us';
        case WhatsAppProvider.CALLMEBOT:
            return cleanNumber.replace('+', '');
        default:
            return cleanNumber;
    }
}

/**
 * Génère un template de message basé sur le statut
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
 * Envoi via Twilio WhatsApp API
 */
async function sendViaTwilio(phoneNumber: string, message: string): Promise<NotificationResponse> {
    const config = PROVIDERS_CONFIG[WhatsAppProvider.TWILIO];

    if (!config.accountSid || !config.authToken || !config.fromNumber) {
        throw new Error('Configuration Twilio manquante');
    }

    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');

    const response = await fetch(
        `${config.apiUrl}/${config.accountSid}/Messages.json`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                From: config.fromNumber,
                To: phoneNumber,
                Body: message
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erreur Twilio');
    }

    return {
        success: true,
        messageId: data.sid,
        timestamp: new Date(),
        provider: 'Twilio'
    };
}

/**
 * Envoi via UltraMsg API
 */
async function sendViaUltraMsg(phoneNumber: string, message: string): Promise<NotificationResponse> {
    const config = PROVIDERS_CONFIG[WhatsAppProvider.ULTRAMSG];

    if (!config.token || !config.instanceId) {
        throw new Error('Configuration UltraMsg manquante');
    }

    const response = await fetch(
        `${config.apiUrl}/${config.instanceId}/messages/chat`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                token: config.token,
                to: phoneNumber,
                body: message
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.sent) {
        throw new Error(data.error || 'Erreur UltraMsg');
    }

    return {
        success: true,
        messageId: data.id,
        timestamp: new Date(),
        provider: 'UltraMsg'
    };
}

/**
 * Envoi via Green API
 */
async function sendViaGreenApi(phoneNumber: string, message: string): Promise<NotificationResponse> {
    const config = PROVIDERS_CONFIG[WhatsAppProvider.GREEN_API];

    if (!config.idInstance || !config.apiTokenInstance) {
        throw new Error('Configuration Green API manquante');
    }

    const response = await fetch(
        `${config.apiUrl}${config.idInstance}/sendMessage/${config.apiTokenInstance}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: phoneNumber,
                message: message
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.idMessage) {
        throw new Error(data.error || 'Erreur Green API');
    }

    return {
        success: true,
        messageId: data.idMessage,
        timestamp: new Date(),
        provider: 'Green API'
    };
}

/**
 * Envoi via CallMeBot (Gratuit mais nécessite configuration préalable)
 */
async function sendViaCallMeBot(phoneNumber: string, message: string): Promise<NotificationResponse> {
    const config = PROVIDERS_CONFIG[WhatsAppProvider.CALLMEBOT];

    if (!config.apiKey) {
        throw new Error('Configuration CallMeBot manquante');
    }

    const response = await fetch(
        `${config.apiUrl}?phone=${phoneNumber}&text=${encodeURIComponent(message)}&apikey=${config.apiKey}`,
        { method: 'GET' }
    );

    const data = await response.text();

    if (!response.ok || !data.includes('Message sent')) {
        throw new Error('Erreur CallMeBot');
    }

    return {
        success: true,
        messageId: Date.now().toString(),
        timestamp: new Date(),
        provider: 'CallMeBot'
    };
}

/**
 * Fonction principale pour envoyer une notification
 * Essaie automatiquement différents fournisseurs
 */
export async function sendNotification(
    payload: NotificationPayload,
    preferredProvider?: WhatsAppProvider
): Promise<NotificationResponse> {

    const finalMessage = generateMessageTemplate(payload.status, payload.message);

    // Ordre de priorité des fournisseurs si aucun n'est spécifié
    const providersOrder = preferredProvider
        ? [preferredProvider]
        : [
            WhatsAppProvider.TWILIO,
            WhatsAppProvider.ULTRAMSG,
            WhatsAppProvider.GREEN_API,
            WhatsAppProvider.CALLMEBOT
        ];

    let lastError = '';

    for (const provider of providersOrder) {
        try {
            const formattedPhone = formatPhoneNumber(payload.phoneNumber, provider);
            if (!formattedPhone) {
                throw new Error(`Numéro de téléphone invalide: ${payload.phoneNumber}`);
            }

            let result: NotificationResponse;

            switch (provider) {
                case WhatsAppProvider.TWILIO:
                    result = await sendViaTwilio(formattedPhone, finalMessage);
                    break;
                case WhatsAppProvider.ULTRAMSG:
                    result = await sendViaUltraMsg(formattedPhone, finalMessage);
                    break;
                case WhatsAppProvider.GREEN_API:
                    result = await sendViaGreenApi(formattedPhone, finalMessage);
                    break;
                case WhatsAppProvider.CALLMEBOT:
                    result = await sendViaCallMeBot(formattedPhone, finalMessage);
                    break;
                default:
                    throw new Error(`Fournisseur non supporté: ${provider}`);
            }

            // Log de succès
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Notification envoyée via ${result.provider}:`, {
                    messageId: result.messageId,
                    to: payload.phoneNumber,
                    status: payload.status
                });
            }

            return result;

        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Erreur inconnue';

            if (process.env.NODE_ENV === 'development') {
                console.warn(`⚠️ Échec avec ${provider}: ${lastError}`);
            }

            // Si c'est le fournisseur préféré ou le dernier, on continue
            continue;
        }
    }

    // Tous les fournisseurs ont échoué
    return {
        success: false,
        error: `Tous les fournisseurs ont échoué. Dernière erreur: ${lastError}`,
        timestamp: new Date()
    };
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
    MessageTemplates,
    NotificationStatus,
    WhatsAppProvider
};
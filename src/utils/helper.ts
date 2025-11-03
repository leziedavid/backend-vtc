/**
 * Transforme un filePath local en URL publique consommable par le frontend.
 * @param filePath Chemin complet du fichier sur le serveur
 * @returns URL publique ou null si filePath est vide
 */
/**
 * Transforme un filePath en URL publique consommable par le frontend.
 * @param filePath Chemin relatif du fichier depuis le dossier uploads
 * @returns URL publique ou null si filePath est vide
 */
export function getPublicFileUrl(filePath: string): string | null {
    if (!filePath) return null;

    // const baseUrl = process.env.SERVEUR_URL || 'http://localhost:4000';
    // const baseUrl = process.env.SERVEUR_URL || 'http://109.199.107.23:4000';
    const baseUrl = process.env.SERVEUR_URL || 'https://api.peoogo.com';

    // Remplace les éventuels backslashes par des slashes
    const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');

    return `${baseUrl}${normalizedPath}`;
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class LocalStorageService {
    private readonly uploadDir: string;

    constructor() {
        // Utilisation de la variable d'environnement ou fallback
        this.uploadDir = process.env.FILE_STORAGE_PATH || path.join(process.cwd(), 'uploads');

        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Sauvegarde un fichier buffer ou chemin local
     */
    async saveFile( fileData: Buffer | string, folder = 'default',): Promise<{
        fileCode: string;
        fileName: string;
        fileMimeType: string;
        fileSize: number;
        filePath: string;
        fileUrl: string;}> {
        const fileCode = randomUUID();
        const targetDir = path.join(this.uploadDir, folder);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        // Cas 1 : chemin local
        if (typeof fileData === 'string') {
            const fileName = path.basename(fileData);
            const destPath = path.join(targetDir, `${fileCode}-${fileName}`);
            try {
                fs.copyFileSync(fileData, destPath);
                const stats = fs.statSync(destPath);
                return {
                    fileCode,
                    fileName,
                    fileMimeType: path.extname(fileName).replace('.', ''),
                    fileSize: stats.size,
                    filePath: destPath,
                    fileUrl: `/uploads/${folder}/${fileCode}-${fileName}`,
                };
            } catch {
                throw new InternalServerErrorException('Échec de la copie du fichier local');
            }
        }

        // Cas 2 : buffer
        try {
            const arrayBuffer = new Uint8Array(fileData);

            // Import dynamique du module ESM
            const fileTypeModule = await import('file-type');
            const type = await fileTypeModule.fromBuffer(arrayBuffer);

            let extension = 'bin';
            let mime = 'application/octet-stream';

            if (type) {
                extension = type.ext;
                mime = type.mime;
            }

            const fileName = `${fileCode}.${extension}`;
            const destPath = path.join(targetDir, fileName);
            await fs.promises.writeFile(destPath, arrayBuffer);
            const stats = await fs.promises.stat(destPath);

            return {
                fileCode,
                fileName,
                fileMimeType: mime,
                fileSize: stats.size,
                filePath: destPath,
                fileUrl: `/uploads/${folder}/${fileName}`,
            };
        } catch (err) {
            throw new InternalServerErrorException('Échec de l’écriture du fichier buffer');
        }
    }

    /**
     * Sauvegarde un fichier et retourne uniquement les champs compatibles avec Prisma FileManager
     */
    async saveFileForPrisma( fileData: Buffer | string, folder = 'default',): Promise<{
        fileCode: string;
        fileName: string;
        fileMimeType: string;
        fileSize: number;
        fileUrl: string;
    }> {
        const upload = await this.saveFile(fileData, folder);

        return {
            fileCode: upload.fileCode,
            fileName: upload.fileName,
            fileMimeType: upload.fileMimeType,
            fileSize: upload.fileSize,
            fileUrl: upload.fileUrl,
        };
    }

    /**
     * Supprime un fichier
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la suppression du fichier local');
        }
    }

    /**
     * Zippe un dossier complet du storage et retourne le chemin du zip
     */
    async downloadFolderAsZip(folder: string): Promise<{ zipPath: string; zipUrl: string }> {
        const folderPath = path.join(this.uploadDir, folder);
        if (!fs.existsSync(folderPath)) throw new InternalServerErrorException('Dossier introuvable');

        const zipFileName = `${folder}.zip`;
        // const zipFileName = `${folder}-${Date.now()}.zip`;
        const zipPath = path.join(this.uploadDir, zipFileName);

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve({
                    zipPath,
                    zipUrl: `/uploads/${zipFileName}`,
                });
            });

            archive.on('error', (err) => reject(err));
            archive.pipe(output);
            archive.directory(folderPath, folder);
            archive.finalize();
        });
    }
}

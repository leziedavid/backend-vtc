import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {

    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    /**
     * Upload un fichier bufferisé (ex: via Multer) vers Cloudinary
     * @param fileData Buffer ou string (chemin temporaire)
     * @param folder   Dossier Cloudinary (ex: 'users')
     */
    async uploadFile(
        fileData: Buffer | string,
        folder = 'default',
    ): Promise<{
        fileCode: string;
        fileName: string;
        fileMimeType: string;
        fileSize: number;
        fileUrl: string;
    }> {
        const fileCode = randomUUID();

        // Cas 1 : fichier local (ex: chemin sur le disque)
        if (typeof fileData === 'string') {
            try {
                const result: UploadApiResponse = await cloudinary.uploader.upload(fileData, {
                    folder,
                    public_id: fileCode,
                    resource_type: 'image',
                    overwrite: true,
                });

                return {
                    fileCode,
                    fileName: `${result.original_filename}.${result.format}`,
                    fileMimeType: result.format,
                    fileSize: result.bytes,
                    fileUrl: result.secure_url,
                };
            } catch (e) {
                throw new InternalServerErrorException('Échec de l’upload sur Cloudinary (fichier local)');
            }
        }

        // Cas 2 : buffer (ex: image envoyée via POST multipart/form-data)
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: fileCode,
                    resource_type: 'image',
                    overwrite: true,
                },
                (error, result: UploadApiResponse) => {
                    if (error || !result) {
                        return reject(
                            new InternalServerErrorException('Échec de l’upload sur Cloudinary (stream)'),
                        );
                    }

                    resolve({
                        fileCode,
                        fileName: `${result.original_filename}.${result.format}`,
                        fileMimeType: result.format,
                        fileSize: result.bytes,
                        fileUrl: result.secure_url,
                    });
                },
            );

            streamifier.createReadStream(fileData).pipe(uploadStream);
        });
    }


    /**
     * Supprime un fichier sur Cloudinary par son public_id
     * @param publicId identifiant du fichier sur Cloudinary
     */
    async deleteFileByPublicId(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image',
            });
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la suppression du fichier Cloudinary');
        }
    }
}

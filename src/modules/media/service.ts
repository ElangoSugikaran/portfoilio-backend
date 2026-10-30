import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import type { UploadApiResponse } from 'cloudinary';
import { PrismaClient, MediaType } from '../../generated/prisma/client.js';
import { cloudinary } from '../../lib/cloudinary.js';
import sharp from 'sharp';

/**
 * Service managing media file compression (Sharp), Cloudinary upload/deletion,
 * and Media database records.
 */
export class MediaService {
  private prisma: PrismaClient;

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma;
  }

  async uploadFile(file: MultipartFile) {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    let buffer = await file.toBuffer();
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    let mediaType: MediaType = 'DOCUMENT';

    if (isImage) {
      resourceType = 'image';
      mediaType = 'IMAGE';
      // Compress and convert to webp if it's an image
      buffer = await sharp(buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } else if (isVideo) {
      resourceType = 'video';
      mediaType = 'VIDEO';
    } else if (file.mimetype === 'application/pdf') {
      resourceType = 'raw';
      mediaType = 'DOCUMENT';
    }

    // Upload to Cloudinary via stream
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: 'portfolio' },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    // Save to Prisma Database
    const media = await this.prisma.media.create({
      data: {
        type: mediaType,
        provider: 'CLOUDINARY',
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
        sizeBytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
      }
    });

    return media;
  }

  async deleteFile(id: string): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new Error('Media not found');

    // Remove from DB first
    await this.prisma.media.delete({ where: { id } });

    // Then remove from Cloudinary
    if (media.provider === 'CLOUDINARY' && media.publicId) {
      await cloudinary.uploader.destroy(media.publicId, { 
        resource_type: media.resourceType || 'image' 
      });
    }
  }
}

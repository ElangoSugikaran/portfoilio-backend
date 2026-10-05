import type { FastifyInstance } from 'fastify';
import { PrismaClient, MediaType } from '../../generated/prisma/client.js';
import { cloudinary } from '../../lib/cloudinary.js';
import sharp from 'sharp';

export class MediaService {
  private prisma: PrismaClient;

  constructor(fastify: any) {
    this.prisma = fastify.prisma;
  }

  async uploadFile(file: any): Promise<any> {
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
      // Cloudinary treats pdfs as images if you want thumbnails, but raw if you just want storage. 
      // We will use raw to ensure it downloads correctly as a document.
      resourceType = 'raw';
      mediaType = 'DOCUMENT';
    }

    // Upload to Cloudinary via stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: 'portfolio' },
        (error, result) => {
          if (error) return reject(error);
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

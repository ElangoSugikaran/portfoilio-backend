import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { PrismaClient, MediaType } from '../../generated/prisma/client.js';
import { buildPublicId, cloudinaryService, formatBytes, getFileExtension, type CloudinaryResourceType } from '../../services/cloudinary.service.js';
import sharp from 'sharp';
import { AppError } from '../../lib/errors.js';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

/**
 * Service managing media file compression (Sharp), Cloudinary upload/deletion,
 * and Media database records.
 */
export class MediaService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma;
    this.fastify = fastify;
  }

  async uploadFile(file: MultipartFile) {
    const originalFileName = file.filename.split(/[\\/]/).pop() || 'file';
    const extension = getFileExtension(originalFileName);
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isPdf = file.mimetype === 'application/pdf' && extension === '.pdf';

    if (!isImage && !isVideo && !isPdf) {
      throw AppError.badRequest('Only image, video, and PDF files are supported.');
    }

    let buffer = await file.toBuffer();

    if (isPdf && buffer.length > MAX_PDF_SIZE) {
      throw AppError.badRequest('PDF file size must not exceed 10MB.');
    }

    let resourceType: CloudinaryResourceType;
    let mediaType: MediaType;
    let publicId: string | undefined;

    if (isImage) {
      resourceType = 'image';
      mediaType = 'IMAGE';
      buffer = await sharp(buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } else if (isVideo) {
      resourceType = 'video';
      mediaType = 'VIDEO';
    } else {
      resourceType = 'raw';
      mediaType = 'DOCUMENT';
      // Raw Cloudinary assets need the extension in the public_id or downloads
      // arrive with a random name and no file extension.
      publicId = buildPublicId('portfolio/documents', originalFileName, '.pdf');
    }

    const uploadResult = await cloudinaryService.uploadBuffer({
      buffer,
      resourceType,
      folder: publicId ? undefined : 'portfolio',
      publicId,
    });

    return this.prisma.media.create({
      data: {
        type: mediaType,
        provider: 'CLOUDINARY',
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
        sizeBytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        alt: isPdf ? originalFileName : undefined,
      },
    });
  }

  async deleteFile(id: string): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw AppError.notFound('Media not found');

    await this.prisma.media.delete({ where: { id } });

    if (media.provider === 'CLOUDINARY' && media.publicId) {
      await cloudinaryService.destroyAsset(
        media.publicId,
        (media.resourceType as CloudinaryResourceType) || 'image',
        this.fastify.log,
      );
    }
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes);
  }
}

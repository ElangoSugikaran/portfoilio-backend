import type { FastifyInstance } from 'fastify';
import { createHash } from 'node:crypto';
import { PrismaClient, type ResumeDocument } from '../../generated/prisma/client.js';
import { AppError } from '../../lib/errors.js';
import {
  buildPublicId,
  cloudinaryService,
  formatBytes,
  getFileExtension,
  sanitizeFileName,
  type CloudinaryResourceType,
} from '../../services/cloudinary.service.js';

export const MAX_CVS = 5;
export const MAX_CV_SIZE = 10 * 1024 * 1024;
const CV_FOLDER = 'portfolio/cv';

export interface CvUploadInput {
  buffer: Buffer;
  fileName: string;
  mimetype: string;
  title?: string;
}

export interface CvDto {
  id: string;
  title: string;
  fileId: string;
  fileUrl: string;
  publicId: string | null;
  resourceType: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: string | null;
  sizeBytes: number | null;
  isPrimary: boolean;
  uploadedAt: string;
  createdAt: Date;
  updatedAt: Date;
}

function toDto(cv: ResumeDocument): CvDto {
  return {
    id: cv.id,
    title: cv.title,
    fileId: cv.fileId,
    fileUrl: cv.fileUrl,
    publicId: cv.publicId,
    resourceType: cv.resourceType,
    mimeType: cv.mimeType,
    fileName: cv.fileName,
    fileSize: cv.fileSize,
    sizeBytes: cv.sizeBytes,
    isPrimary: cv.isPrimary,
    uploadedAt: cv.uploadedAt,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };
}

function deriveTitle(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base ? base.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Curriculum Vitae';
}

export class CvService {
  private prisma: PrismaClient;

  constructor(private fastify: FastifyInstance) {
    this.prisma = fastify.prisma;
  }

  async list(): Promise<CvDto[]> {
    const cvs = await this.prisma.resumeDocument.findMany({
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
    return cvs.map(toDto);
  }

  async getById(id: string): Promise<CvDto> {
    const cv = await this.prisma.resumeDocument.findUnique({ where: { id } });
    if (!cv) throw AppError.notFound('CV document not found');
    return toDto(cv);
  }

  private validatePdf(input: CvUploadInput): void {
    const extension = getFileExtension(input.fileName);
    if (input.mimetype !== 'application/pdf' || extension !== '.pdf') {
      throw AppError.badRequest('Only PDF files are accepted for CV uploads.');
    }
    if (!input.buffer.length) {
      throw AppError.badRequest('The uploaded PDF is empty.');
    }
    if (input.buffer.length > MAX_CV_SIZE) {
      throw AppError.badRequest('CV file size must not exceed 10MB.');
    }
  }

  private hash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  async upload(input: CvUploadInput): Promise<CvDto> {
    this.validatePdf(input);

    const count = await this.prisma.resumeDocument.count();
    if (count >= MAX_CVS) {
      throw AppError.badRequest(`You can keep up to ${MAX_CVS} CVs. Delete one before uploading another.`);
    }

    const fileHash = this.hash(input.buffer);
    const duplicate = await this.prisma.resumeDocument.findUnique({ where: { fileHash } });
    if (duplicate) {
      throw AppError.conflict('This CV has already been uploaded.', 'DUPLICATE_CV');
    }

    const originalFileName = input.fileName.split(/[\\/]/).pop() || 'resume.pdf';
    const publicId = buildPublicId(CV_FOLDER, originalFileName, '.pdf');
    const uploadResult = await cloudinaryService.uploadBuffer({
      buffer: input.buffer,
      resourceType: 'raw',
      publicId,
    });

    const hasPrimary = await this.prisma.resumeDocument.count({ where: { isPrimary: true } });
    const title = input.title?.trim() || deriveTitle(originalFileName);

    try {
      const cv = await this.prisma.resumeDocument.create({
        data: {
          title,
          fileId: uploadResult.public_id,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          resourceType: 'raw',
          mimeType: 'application/pdf',
          fileName: originalFileName,
          fileSize: formatBytes(uploadResult.bytes),
          sizeBytes: uploadResult.bytes,
          fileHash,
          isPrimary: hasPrimary === 0,
          uploadedAt: new Date().toISOString(),
        },
      });
      return toDto(cv);
    } catch (error: any) {
      // Never leave an uploaded asset behind if the DB write fails.
      await cloudinaryService.destroyAsset(uploadResult.public_id, 'raw', this.fastify.log);
      if (error?.code === 'P2002') {
        throw AppError.conflict('This CV has already been uploaded.', 'DUPLICATE_CV');
      }
      throw error;
    }
  }

  async update(id: string, input: Partial<CvUploadInput>): Promise<CvDto> {
    const existing = await this.prisma.resumeDocument.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('CV document not found');

    const title = input.title?.trim() || existing.title;
    const hasNewFile = Boolean(input.buffer && input.fileName && input.mimetype);

    if (!hasNewFile) {
      const cv = await this.prisma.resumeDocument.update({
        where: { id },
        data: { title },
      });
      return toDto(cv);
    }

    const fileInput: CvUploadInput = {
      buffer: input.buffer!,
      fileName: input.fileName!,
      mimetype: input.mimetype!,
      title,
    };
    this.validatePdf(fileInput);

    const fileHash = this.hash(fileInput.buffer!);
    if (fileHash === existing.fileHash) {
      const cv = await this.prisma.resumeDocument.update({ where: { id }, data: { title } });
      return toDto(cv);
    }

    const duplicate = await this.prisma.resumeDocument.findFirst({
      where: { fileHash, NOT: { id } },
    });
    if (duplicate) {
      throw AppError.conflict('This CV has already been uploaded.', 'DUPLICATE_CV');
    }

    const originalFileName = fileInput.fileName.split(/[\\/]/).pop() || 'resume.pdf';
    const publicId = buildPublicId(CV_FOLDER, originalFileName, '.pdf');
    const uploadResult = await cloudinaryService.uploadBuffer({
      buffer: fileInput.buffer,
      resourceType: 'raw',
      publicId,
    });

    try {
      const cv = await this.prisma.resumeDocument.update({
        where: { id },
        data: {
          title,
          fileId: uploadResult.public_id,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          resourceType: 'raw',
          mimeType: 'application/pdf',
          fileName: originalFileName,
          fileSize: formatBytes(uploadResult.bytes),
          sizeBytes: uploadResult.bytes,
          fileHash,
          uploadedAt: new Date().toISOString(),
        },
      });

      // The DB now points to the new asset, so the old one can safely go.
      if (existing.publicId) {
        await cloudinaryService.destroyAsset(
          existing.publicId,
          (existing.resourceType as any) || 'raw',
          this.fastify.log,
        );
      }

      return toDto(cv);
    } catch (error: any) {
      await cloudinaryService.destroyAsset(uploadResult.public_id, 'raw', this.fastify.log);
      if (error?.code === 'P2002') {
        throw AppError.conflict('This CV has already been uploaded.', 'DUPLICATE_CV');
      }
      throw error;
    }
  }

  async setPrimary(id: string): Promise<CvDto> {
    const existing = await this.prisma.resumeDocument.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('CV document not found');

    const [, cv] = await this.prisma.$transaction([
      this.prisma.resumeDocument.updateMany({ data: { isPrimary: false } }),
      this.prisma.resumeDocument.update({ where: { id }, data: { isPrimary: true } }),
    ]);

    return toDto(cv);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.resumeDocument.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('CV document not found');

    await this.prisma.resumeDocument.delete({ where: { id } });

    if (existing.isPrimary) {
      const next = await this.prisma.resumeDocument.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.resumeDocument.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    if (existing.publicId) {
      await cloudinaryService.destroyAsset(
        existing.publicId,
        (existing.resourceType as any) || 'raw',
        this.fastify.log,
      );
    }
  }

  async download(id: string): Promise<{ cv: CvDto; buffer: Buffer; filename: string }> {
    const cv = await this.getById(id);
    let buffer: Buffer;

    try {
      buffer = await cloudinaryService.fetchAssetBuffer(
        cv.publicId || cv.fileId,
        (cv.resourceType as CloudinaryResourceType) || 'raw',
        cv.fileUrl,
      );
    } catch (error: any) {
      throw AppError.internal(error?.message || 'Could not retrieve the CV file from Cloudinary.');
    }

    const fallbackName = `${sanitizeFileName(cv.title)}.pdf`;
    const rawName = cv.fileName || fallbackName;
    const filename = (rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`)
      .replace(/[\r\n"]/g, '_');

    return {
      cv,
      buffer,
      filename,
    };
  }
}

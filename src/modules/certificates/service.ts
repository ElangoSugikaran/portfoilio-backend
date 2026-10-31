import type { FastifyInstance } from 'fastify';
import type { CreateCertificateInput, UpdateCertificateInput } from './schema.js';
import { deleteMediaAsset } from '../../services/media-asset.service.js';

/**
 * Service managing academic and digital certificates with media image relations.
 */
export class CertificatesService {
  constructor(private fastify: FastifyInstance) {}

  async getAll(filter?: { isVisible?: boolean; category?: any }) {
    return await this.fastify.prisma.certificate.findMany({
      where: {
        ...(filter?.isVisible !== undefined ? { isVisible: filter.isVisible } : { isVisible: true }),
        ...(filter?.category ? { category: filter.category } : {})
      },
      include: {
        image: true // Include related media to easily display image on frontend
      },
      orderBy: [
        { sortOrder: 'asc' },
        { issuedAt: 'desc' }
      ]
    });
  }

  async getById(id: string) {
    return await this.fastify.prisma.certificate.findUnique({
      where: { id },
      include: {
        image: true
      }
    });
  }

  async create(data: CreateCertificateInput) {
    return await this.fastify.prisma.certificate.create({
      data,
      include: { image: true }
    });
  }

  async update(id: string, data: UpdateCertificateInput) {
    const existing = await this.fastify.prisma.certificate.findUnique({
      where: { id },
      select: { imageId: true },
    });

    const certificate = await this.fastify.prisma.certificate.update({
      where: { id },
      data,
      include: { image: true }
    });

    if (existing && data.imageId && data.imageId !== existing.imageId) {
      await deleteMediaAsset(this.fastify.prisma, existing.imageId, this.fastify.log);
    }

    return certificate;
  }

  async delete(id: string) {
    const existing = await this.fastify.prisma.certificate.findUnique({
      where: { id },
      select: { imageId: true },
    });

    const certificate = await this.fastify.prisma.certificate.delete({
      where: { id }
    });

    await deleteMediaAsset(this.fastify.prisma, existing?.imageId, this.fastify.log);

    return certificate;
  }
}

import type { FastifyInstance } from 'fastify';
import type { CreateCertificateInput, UpdateCertificateInput } from './schema.js';

export class CertificatesService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await (this.fastify as any).prisma.certificate.findMany({
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
    return await (this.fastify as any).prisma.certificate.findUnique({
      where: { id },
      include: {
        image: true
      }
    });
  }

  async create(data: CreateCertificateInput) {
    return await (this.fastify as any).prisma.certificate.create({
      data,
      include: { image: true }
    });
  }

  async update(id: string, data: UpdateCertificateInput) {
    return await (this.fastify as any).prisma.certificate.update({
      where: { id },
      data,
      include: { image: true }
    });
  }

  async delete(id: string) {
    return await (this.fastify as any).prisma.certificate.delete({
      where: { id }
    });
  }
}

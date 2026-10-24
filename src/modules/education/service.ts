import type { FastifyInstance } from 'fastify';
import type { CreateEducationInput, UpdateEducationInput } from './schema.js';

/**
 * Service managing formal education entries (degrees, diplomas, training).
 */
export class EducationService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await this.fastify.prisma.education.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' }
      ]
    });
  }

  async getById(id: string) {
    return await this.fastify.prisma.education.findUnique({
      where: { id }
    });
  }

  async create(data: CreateEducationInput) {
    return await this.fastify.prisma.education.create({
      data
    });
  }

  async update(id: string, data: UpdateEducationInput) {
    return await this.fastify.prisma.education.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await this.fastify.prisma.education.delete({
      where: { id }
    });
  }
}

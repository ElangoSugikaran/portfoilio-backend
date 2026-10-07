import type { FastifyInstance } from 'fastify';
import type { CreateEducationInput, UpdateEducationInput } from './schema.js';

export class EducationService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await (this.fastify as any).prisma.education.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { startYear: 'desc' }
      ]
    });
  }

  async getById(id: string) {
    return await (this.fastify as any).prisma.education.findUnique({
      where: { id }
    });
  }

  async create(data: CreateEducationInput) {
    return await (this.fastify as any).prisma.education.create({
      data
    });
  }

  async update(id: string, data: UpdateEducationInput) {
    return await (this.fastify as any).prisma.education.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await (this.fastify as any).prisma.education.delete({
      where: { id }
    });
  }
}

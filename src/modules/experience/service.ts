import type { FastifyInstance } from 'fastify';
import type { CreateExperienceInput, UpdateExperienceInput } from './schema.js';

export class ExperienceService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await (this.fastify as any).prisma.experience.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' }
      ]
    });
  }

  async getById(id: string) {
    return await (this.fastify as any).prisma.experience.findUnique({
      where: { id }
    });
  }

  async create(data: CreateExperienceInput) {
    return await (this.fastify as any).prisma.experience.create({
      data
    });
  }

  async update(id: string, data: UpdateExperienceInput) {
    return await (this.fastify as any).prisma.experience.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await (this.fastify as any).prisma.experience.delete({
      where: { id }
    });
  }
}

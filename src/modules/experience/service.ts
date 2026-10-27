import type { FastifyInstance } from 'fastify';
import type { CreateExperienceInput, UpdateExperienceInput } from './schema.js';

/**
 * Service managing work experience records.
 */
export class ExperienceService {
  constructor(private fastify: FastifyInstance) {}

  async getAll(filter?: { isVisible?: boolean }) {
    return await this.fastify.prisma.experience.findMany({
      where: {
        ...(filter?.isVisible !== undefined ? { isVisible: filter.isVisible } : { isVisible: true })
      },
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' }
      ]
    });
  }

  async getById(id: string) {
    return await this.fastify.prisma.experience.findUnique({
      where: { id }
    });
  }

  async create(data: CreateExperienceInput) {
    return await this.fastify.prisma.experience.create({
      data
    });
  }

  async update(id: string, data: UpdateExperienceInput) {
    return await this.fastify.prisma.experience.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await this.fastify.prisma.experience.delete({
      where: { id }
    });
  }
}

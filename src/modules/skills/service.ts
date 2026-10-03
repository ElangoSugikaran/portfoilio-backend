import type { FastifyInstance } from 'fastify';
import type { CreateSkillInput, UpdateSkillInput } from './schema.js';

export class SkillsService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await (this.fastify as any).prisma.technology.findMany({
      orderBy: { sortOrder: 'asc' }
    });
  }

  async getById(id: string) {
    return await (this.fastify as any).prisma.technology.findUnique({
      where: { id }
    });
  }

  async create(data: CreateSkillInput) {
    return await (this.fastify as any).prisma.technology.create({
      data
    });
  }

  async update(id: string, data: UpdateSkillInput) {
    return await (this.fastify as any).prisma.technology.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await (this.fastify as any).prisma.technology.delete({
      where: { id }
    });
  }
}

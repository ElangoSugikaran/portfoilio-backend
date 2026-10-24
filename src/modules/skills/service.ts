import type { FastifyInstance } from 'fastify';
import type { CreateSkillInput, UpdateSkillInput } from './schema.js';

/**
 * Service handling business logic for Skills / Technologies.
 * Connects directly to the PostgreSQL database via PrismaClient.
 */
export class SkillsService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Retrieve all skills ordered by display sort order
   */
  async getAll() {
    return await this.fastify.prisma.technology.findMany({
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Retrieve a single skill by ID
   */
  async getById(id: string) {
    return await this.fastify.prisma.technology.findUnique({
      where: { id }
    });
  }

  /**
   * Create a new skill / technology
   */
  async create(data: CreateSkillInput) {
    return await this.fastify.prisma.technology.create({
      data
    });
  }

  /**
   * Update an existing skill / technology by ID
   */
  async update(id: string, data: UpdateSkillInput) {
    return await this.fastify.prisma.technology.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a skill / technology by ID
   */
  async delete(id: string) {
    return await this.fastify.prisma.technology.delete({
      where: { id }
    });
  }
}

import type { FastifyInstance } from 'fastify';
import type { CreateProjectInput, UpdateProjectInput } from './schema.js';

export class ProjectService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await (this.fastify as any).prisma.project.findMany({
      include: {
        category: true,
        thumbnail: true,
        technologies: true,
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async getById(id: string) {
    return await (this.fastify as any).prisma.project.findUnique({
      where: { id },
      include: {
        category: true,
        thumbnail: true,
        technologies: true,
        media: {
          include: { media: true }
        },
        phases: true
      }
    });
  }

  async create(data: CreateProjectInput) {
    const { technologyIds, ...rest } = data;
    
    return await (this.fastify as any).prisma.project.create({
      data: {
        ...rest,
        technologies: technologyIds.length > 0 ? {
          connect: technologyIds.map((id) => ({ id }))
        } : undefined
      },
      include: { technologies: true }
    });
  }

  async update(id: string, data: UpdateProjectInput) {
    const { technologyIds, ...rest } = data;
    
    return await (this.fastify as any).prisma.project.update({
      where: { id },
      data: {
        ...rest,
        technologies: technologyIds ? {
          set: technologyIds.map((tid) => ({ id: tid }))
        } : undefined
      },
      include: { technologies: true }
    });
  }

  async delete(id: string) {
    return await (this.fastify as any).prisma.project.delete({
      where: { id }
    });
  }
}

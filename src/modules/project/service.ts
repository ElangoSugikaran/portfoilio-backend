import type { FastifyInstance } from 'fastify';
import type { CreateProjectInput, UpdateProjectInput } from './schema.js';

export class ProjectService {
  constructor(private fastify: FastifyInstance) {}

  async getAll() {
    return await (this.fastify as any).prisma.project.findMany({
      include: {
        category: true,
        thumbnail: true,
        media: { include: { media: true } },
        technologies: true,
        phases: { orderBy: { sortOrder: 'asc' } }
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
        phases: { orderBy: { sortOrder: 'asc' } }
      }
    });
  }

  async create(data: CreateProjectInput) {
    const { technologyIds, projectMedia, phases, ...rest } = data;
    
    return await (this.fastify as any).prisma.project.create({
      data: {
        ...rest,
        technologies: technologyIds && technologyIds.length > 0 ? {
          connect: technologyIds.map((id) => ({ id }))
        } : undefined,
        media: projectMedia && projectMedia.length > 0 ? {
          create: projectMedia.map((m) => ({
            mediaId: m.mediaId,
            role: m.role,
            group: m.group,
            caption: m.caption,
            sortOrder: m.sortOrder
          }))
        } : undefined,
        phases: phases && phases.length > 0 ? {
          create: phases.map((p, idx) => ({
            name: p.name,
            tasks: p.tasks,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            sortOrder: p.sortOrder ?? idx
          }))
        } : undefined
      },
      include: {
        technologies: true,
        media: { include: { media: true } },
        phases: { orderBy: { sortOrder: 'asc' } }
      }
    });
  }

  async update(id: string, data: UpdateProjectInput) {
    const { technologyIds, projectMedia, phases, ...rest } = data;
    
    return await (this.fastify as any).prisma.project.update({
      where: { id },
      data: {
        ...rest,
        technologies: technologyIds ? {
          set: technologyIds.map((tid) => ({ id: tid }))
        } : undefined,
        media: projectMedia ? {
          deleteMany: {}, // Clear existing media links
          create: projectMedia.map((m) => ({
            mediaId: m.mediaId,
            role: m.role,
            group: m.group,
            caption: m.caption,
            sortOrder: m.sortOrder
          }))
        } : undefined,
        phases: phases ? {
          deleteMany: {}, // Clear existing phases
          create: phases.map((p, idx) => ({
            name: p.name,
            tasks: p.tasks,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            sortOrder: p.sortOrder ?? idx
          }))
        } : undefined
      },
      include: {
        technologies: true,
        media: { include: { media: true } },
        phases: { orderBy: { sortOrder: 'asc' } }
      }
    });
  }

  async delete(id: string) {
    return await (this.fastify as any).prisma.project.delete({
      where: { id }
    });
  }
}

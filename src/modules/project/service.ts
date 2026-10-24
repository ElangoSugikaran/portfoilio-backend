import type { FastifyInstance } from 'fastify';
import type { CreateProjectInput, UpdateProjectInput } from './schema.js';

/**
 * Service managing business logic and relational database queries for Projects.
 * Handles related technologies, media associations, and timeline phases.
 */
export class ProjectService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Fetch all projects ordered by sortOrder, including related relations
   */
  async getAll() {
    return await this.fastify.prisma.project.findMany({
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

  /**
   * Fetch a single project by ID with all relations
   */
  async getById(id: string) {
    return await this.fastify.prisma.project.findUnique({
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

  /**
   * Create a new project with relations (technologies, media, phases)
   */
  async create(data: CreateProjectInput) {
    const { technologyIds, projectMedia, phases, ...rest } = data;
    
    return await this.fastify.prisma.project.create({
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

  /**
   * Update an existing project and synchronize relations
   */
  async update(id: string, data: UpdateProjectInput) {
    const { technologyIds, projectMedia, phases, ...rest } = data;
    
    return await this.fastify.prisma.project.update({
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

  /**
   * Delete a project by ID
   */
  async delete(id: string) {
    return await this.fastify.prisma.project.delete({
      where: { id }
    });
  }
}

import type { FastifyInstance } from 'fastify';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from './schema.js';
import { deleteMediaAssets } from '../../services/media-asset.service.js';

const companyProjectWhere = {
  OR: [
    { slug: { in: ['rentzee', 'digital-tourism'] } },
    { title: { contains: 'rentzee', mode: 'insensitive' as const } },
    { title: { contains: 'digital tourism', mode: 'insensitive' as const } },
  ],
};

/**
 * Service managing business logic and relational database queries for Projects.
 * Handles related technologies, media associations, and timeline phases.
 */
export class ProjectService {
  constructor(private fastify: FastifyInstance) {}

  async getAll(filter: ProjectListQuery = {}) {
    const status = filter.all ? undefined : filter.status ?? 'PUBLISHED';
    const featured = filter.featured ?? filter.feature;
    const paginationRequested = filter.page !== undefined || filter.pageSize !== undefined;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 6;
    const baseWhere = {
      ...(status ? { status } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };
    const regularProjectWhere = {
      ...baseWhere,
      NOT: companyProjectWhere,
    };
    const where = {
      ...baseWhere,
      ...(filter.category === 'company-work'
        ? companyProjectWhere
        : filter.category
          ? { categoryId: filter.category, NOT: companyProjectWhere }
          : {}),
    };

    const projectsQuery = this.fastify.prisma.project.findMany({
      where,
      include: {
        category: true,
        thumbnail: true,
        media: { include: { media: true } },
        technologies: true,
        phases: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      ...(paginationRequested ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
    });

    if (!paginationRequested) {
      return {
        projects: await projectsQuery,
        pagination: undefined,
        filters: undefined,
      };
    }

    const [projects, total, availableTotal, projectCategories, companyProjectsCount] = await Promise.all([
      projectsQuery,
      this.fastify.prisma.project.count({ where }),
      this.fastify.prisma.project.count({ where: baseWhere }),
      this.fastify.prisma.projectCategory.findMany({
        where: { projects: { some: regularProjectWhere } },
        select: {
          id: true,
          name: true,
          _count: { select: { projects: { where: regularProjectWhere } } },
        },
      }),
      this.fastify.prisma.project.count({
        where: { ...baseWhere, ...companyProjectWhere },
      }),
    ]);

    const categories = [
      ...(companyProjectsCount > 0
        ? [{ id: 'company-work', name: 'Company Work', count: companyProjectsCount }]
        : []),
      ...projectCategories.map((category) => ({
        id: category.id,
        name: category.name,
        count: category._count.projects,
      })),
    ].sort((a, b) => {
      if (a.id === 'company-work') return -1;
      if (b.id === 'company-work') return 1;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      projects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        total: availableTotal,
        categories,
      },
    };
  }

  /**
   * Fetch a single project by ID or slug with all relations
   */
  async getById(id: string, filter?: { status?: 'PUBLISHED' | 'DRAFT' }) {
    return await this.fastify.prisma.project.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        ...(filter?.status ? { status: filter.status } : {})
      },
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

    const existing = await this.fastify.prisma.project.findUnique({
      where: { id },
      include: { media: { select: { mediaId: true } } },
    });

    const project = await this.fastify.prisma.project.update({
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

    if (existing) {
      const keptMediaIds = new Set((projectMedia ?? []).map((media) => media.mediaId));
      const removedMediaIds = existing.media
        .map((media) => media.mediaId)
        .filter((mediaId) => !keptMediaIds.has(mediaId));

      await deleteMediaAssets(this.fastify.prisma, removedMediaIds, this.fastify.log);

      if (data.thumbnailId !== undefined && data.thumbnailId !== existing.thumbnailId) {
        await deleteMediaAssets(this.fastify.prisma, [existing.thumbnailId], this.fastify.log);
      }
    }

    return project;
  }

  /**
   * Delete a project by ID
   */
  async delete(id: string) {
    const existing = await this.fastify.prisma.project.findUnique({
      where: { id },
      include: { media: { select: { mediaId: true } } },
    });

    const project = await this.fastify.prisma.project.delete({
      where: { id }
    });

    if (existing) {
      await deleteMediaAssets(
        this.fastify.prisma,
        [existing.thumbnailId, ...existing.media.map((media) => media.mediaId)],
        this.fastify.log,
      );
    }

    return project;
  }
}

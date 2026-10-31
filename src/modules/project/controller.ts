import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { ProjectService } from './service.js';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from './schema.js';

function toPublicMedia(media: any) {
  if (!media) return null;

  return {
    id: media.id,
    type: media.type,
    url: media.url,
    alt: media.alt,
  };
}

function toPublicProject(project: any) {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    shortDescription: project.shortDescription,
    description: project.description,
    featured: project.featured,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    objectives: project.objectives,
    features: project.features,
    category: project.category
      ? {
          id: project.category.id,
          name: project.category.name,
          slug: project.category.slug,
        }
      : null,
    thumbnail: toPublicMedia(project.thumbnail),
    technologies: project.technologies.map((technology: any) => ({
      id: technology.id,
      name: technology.name,
      category: technology.category,
      icon: technology.icon,
    })),
    media: project.media.map((link: any) => ({
      id: link.id,
      role: link.role,
      group: link.group,
      caption: link.caption,
      sortOrder: link.sortOrder,
      media: toPublicMedia(link.media),
    })),
    phases: project.phases.map((phase: any) => ({
      id: phase.id,
      name: phase.name,
      tasks: phase.tasks,
      startDate: phase.startDate,
      endDate: phase.endDate,
      sortOrder: phase.sortOrder,
    })),
  };
}

/**
 * Controller handling HTTP requests and responses for the Projects module.
 * Formats standardized JSON payloads for frontend client and admin dashboard.
 */
export class ProjectController {
  private service: ProjectService;

  constructor(fastify: FastifyInstance) {
    this.service = new ProjectService(fastify);
  }

  getAll = async (
    request: FastifyRequest<{ Querystring: ProjectListQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const isAdmin = Boolean(request.user);
      const result = await this.service.getAll(
        isAdmin
          ? request.query
          : {
              ...request.query,
              all: undefined,
              status: 'PUBLISHED',
            },
      );
      reply.send({
        success: true,
        data: isAdmin ? result.projects : result.projects.map(toPublicProject),
        ...(result.pagination
          ? {
              meta: {
                pagination: result.pagination,
                filters: result.filters,
              },
            }
          : {}),
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (
    request: FastifyRequest<{ Params: { id: string }, Querystring: { status?: 'PUBLISHED' | 'DRAFT'; all?: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const isAdmin = Boolean(request.user);
      const status = isAdmin
        ? request.query?.all === 'true'
          ? undefined
          : request.query?.status ?? 'PUBLISHED'
        : 'PUBLISHED';
      const project = await this.service.getById(request.params.id, { status });
      if (!project) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Project not found' });
      }
      reply.send({ success: true, data: isAdmin ? project : toPublicProject(project) });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateProjectInput }>, reply: FastifyReply) => {
    try {
      const project = await this.service.create(request.body);
      reply.status(201).send({ 
        success: true, 
        message: 'Project created successfully', 
        data: project 
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'A project with this slug already exists' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateProjectInput }>, reply: FastifyReply) => {
    try {
      const project = await this.service.update(request.params.id, request.body);
      reply.send({ 
        success: true, 
        message: 'Project updated successfully', 
        data: project 
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Project not found' });
      }
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'A project with this slug already exists' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  delete = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await this.service.delete(request.params.id);
      reply.send({ success: true, message: 'Project deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Project not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

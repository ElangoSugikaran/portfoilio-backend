import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { ProjectService } from './service.js';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from './schema.js';

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
      const result = await this.service.getAll(request.query);
      reply.send({
        success: true,
        data: result.projects,
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
    request: FastifyRequest<{ Params: { id: string }, Querystring: { status?: 'PUBLISHED' | 'DRAFT' } }>, 
    reply: FastifyReply
  ) => {
    try {
      const status = request.query?.status ?? 'PUBLISHED';
      const project = await this.service.getById(request.params.id, { status });
      if (!project) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Project not found' });
      }
      reply.send({ success: true, data: project });
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

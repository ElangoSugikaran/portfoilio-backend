import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { EducationService } from './service.js';
import type { CreateEducationInput, EducationListQuery, UpdateEducationInput, ReorderEducationInput } from './schema.js';

function toPublicEducation(education: any) {
  return {
    id: education.id,
    title: education.title,
    institution: education.institution,
    type: education.type,
    startDate: education.startDate,
    endDate: education.endDate,
    grade: education.grade,
    description: education.description,
    icon: education.icon,
  };
}

/**
 * Controller handling HTTP requests and responses for Education history.
 */
export class EducationController {
  private service: EducationService;

  constructor(fastify: FastifyInstance) {
    this.service = new EducationService(fastify);
  }

  getAll = async (
    request: FastifyRequest<{ Querystring: EducationListQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const isAdmin = Boolean(request.user);
      const showOnHome = request.query.showOnHome;
      const includeHidden = isAdmin && Boolean(request.query.all);
      const isVisible = includeHidden
        ? undefined
        : isAdmin
          ? request.query.isVisible ?? true
          : true;

      const education = await this.service.getAll({
        all: includeHidden,
        isVisible,
        ...(showOnHome !== undefined ? { showOnHome } : {}),
        ...(request.query.home ? { home: true } : {}),
      });
      reply.send({
        success: true,
        data: isAdmin ? education : education.map(toPublicEducation),
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const education = await this.service.getById(request.params.id);
      if (!education || (!education.isVisible && !request.user)) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Education not found' });
      }
      reply.send({
        success: true,
        data: request.user ? education : toPublicEducation(education),
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateEducationInput }>, reply: FastifyReply) => {
    try {
      const education = await this.service.create(request.body);
      reply.status(201).send({ 
        success: true, 
        message: 'Education entry created successfully', 
        data: education 
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateEducationInput }>, reply: FastifyReply) => {
    try {
      const education = await this.service.update(request.params.id, request.body);
      reply.send({ 
        success: true, 
        message: 'Education entry updated successfully', 
        data: education 
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Education not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  reorder = async (request: FastifyRequest<{ Body: ReorderEducationInput }>, reply: FastifyReply) => {
    try {
      await this.service.reorder(request.body.orders);
      reply.send({ success: true, message: 'Education entries reordered successfully' });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  delete = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await this.service.delete(request.params.id);
      reply.send({ success: true, message: 'Education deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Education not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

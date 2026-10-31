import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { ExperienceService } from './service.js';
import type { CreateExperienceInput, UpdateExperienceInput } from './schema.js';

function toPublicExperience(experience: any) {
  return {
    id: experience.id,
    role: experience.role,
    company: experience.company,
    companyUrl: experience.companyUrl,
    location: experience.location,
    startDate: experience.startDate,
    endDate: experience.endDate,
    description: experience.description,
    icon: experience.icon,
  };
}

/**
 * Controller handling HTTP requests and responses for Experience entries.
 */
export class ExperienceController {
  private service: ExperienceService;

  constructor(fastify: FastifyInstance) {
    this.service = new ExperienceService(fastify);
  }

  getAll = async (
    request: FastifyRequest<{ Querystring: { all?: string; isVisible?: string } }>, 
    reply: FastifyReply
  ) => {
    try {
      const isAdmin = Boolean(request.user);
      const isVisible = isAdmin
        ? request.query?.all === 'true'
          ? undefined
          : request.query?.isVisible !== undefined
            ? request.query.isVisible === 'true'
            : true
        : true;
      const experience = await this.service.getAll(isVisible !== undefined ? { isVisible } : undefined);
      reply.send({
        success: true,
        data: isAdmin ? experience : experience.map(toPublicExperience),
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const experience = await this.service.getById(request.params.id);
      if (!experience || (!experience.isVisible && !request.user)) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Experience not found' });
      }
      reply.send({
        success: true,
        data: request.user ? experience : toPublicExperience(experience),
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateExperienceInput }>, reply: FastifyReply) => {
    try {
      const experience = await this.service.create(request.body);
      reply.status(201).send({ 
        success: true, 
        message: 'Experience created successfully', 
        data: experience 
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateExperienceInput }>, reply: FastifyReply) => {
    try {
      const experience = await this.service.update(request.params.id, request.body);
      reply.send({ 
        success: true, 
        message: 'Experience updated successfully', 
        data: experience 
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Experience not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  delete = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await this.service.delete(request.params.id);
      reply.send({ success: true, message: 'Experience deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Experience not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

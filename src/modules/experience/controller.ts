import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { ExperienceService } from './service.js';
import type { CreateExperienceInput, UpdateExperienceInput } from './schema.js';

/**
 * Controller handling HTTP requests and responses for Experience entries.
 */
export class ExperienceController {
  private service: ExperienceService;

  constructor(fastify: FastifyInstance) {
    this.service = new ExperienceService(fastify);
  }

  getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const experience = await this.service.getAll();
      reply.send({ success: true, data: experience });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const experience = await this.service.getById(request.params.id);
      if (!experience) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Experience not found' });
      }
      reply.send({ success: true, data: experience });
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

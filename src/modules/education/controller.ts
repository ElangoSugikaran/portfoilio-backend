import type { FastifyRequest, FastifyReply } from 'fastify';
import { EducationService } from './service.js';
import type { CreateEducationInput, UpdateEducationInput } from './schema.js';

export class EducationController {
  private service: EducationService;

  constructor(fastify: any) {
    this.service = new EducationService(fastify);
  }

  getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const education = await this.service.getAll();
      reply.send({ success: true, data: education });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const education = await this.service.getById(request.params.id);
      if (!education) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Education not found' });
      }
      reply.send({ success: true, data: education });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateEducationInput }>, reply: FastifyReply) => {
    try {
      const education = await this.service.create(request.body);
      reply.status(201).send({ success: true, data: education });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateEducationInput }>, reply: FastifyReply) => {
    try {
      const education = await this.service.update(request.params.id, request.body);
      reply.send({ success: true, data: education });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Education not found' });
      }
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

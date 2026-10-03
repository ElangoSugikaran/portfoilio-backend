import type { FastifyRequest, FastifyReply } from 'fastify';
import { CertificatesService } from './service.js';
import type { CreateCertificateInput, UpdateCertificateInput } from './schema.js';

export class CertificatesController {
  private service: CertificatesService;

  constructor(fastify: any) {
    this.service = new CertificatesService(fastify);
  }

  getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const certificates = await this.service.getAll();
      reply.send({ success: true, data: certificates });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const certificate = await this.service.getById(request.params.id);
      if (!certificate) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Certificate not found' });
      }
      reply.send({ success: true, data: certificate });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateCertificateInput }>, reply: FastifyReply) => {
    try {
      const certificate = await this.service.create(request.body);
      reply.status(201).send({ success: true, data: certificate });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateCertificateInput }>, reply: FastifyReply) => {
    try {
      const certificate = await this.service.update(request.params.id, request.body);
      reply.send({ success: true, data: certificate });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Certificate not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  delete = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await this.service.delete(request.params.id);
      reply.send({ success: true, message: 'Certificate deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Certificate not found' });
      }
      // P2003 = Foreign key constraint failed. E.g. restricting deletion if it's referenced somewhere.
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

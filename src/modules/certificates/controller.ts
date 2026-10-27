import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { CertificatesService } from './service.js';
import type { CreateCertificateInput, UpdateCertificateInput } from './schema.js';

/**
 * Controller handling HTTP requests and responses for Certificates.
 */
export class CertificatesController {
  private service: CertificatesService;

  constructor(fastify: FastifyInstance) {
    this.service = new CertificatesService(fastify);
  }

  getAll = async (
    request: FastifyRequest<{ Querystring: { all?: string; isVisible?: string; category?: any } }>, 
    reply: FastifyReply
  ) => {
    try {
      const isVisible = request.query?.all === 'true' 
        ? undefined 
        : request.query?.isVisible !== undefined 
          ? request.query.isVisible === 'true' 
          : true;
      const category = request.query?.category;

      const certificates = await this.service.getAll({
        ...(isVisible !== undefined ? { isVisible } : {}),
        ...(category ? { category } : {})
      });
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
      reply.status(201).send({ 
        success: true, 
        message: 'Certificate created successfully', 
        data: certificate 
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateCertificateInput }>, reply: FastifyReply) => {
    try {
      const certificate = await this.service.update(request.params.id, request.body);
      reply.send({ 
        success: true, 
        message: 'Certificate updated successfully', 
        data: certificate 
      });
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
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

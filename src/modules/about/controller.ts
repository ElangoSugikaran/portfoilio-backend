import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AboutService } from './service.js';
import type { UpdateAboutInput } from './schema.js';

export class AboutController {
  private service: AboutService;

  constructor(fastify: FastifyInstance) {
    this.service = new AboutService(fastify);
  }

  getAbout = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.service.getAbout();
      reply.send({ success: true, data });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  updateAbout = async (request: FastifyRequest<{ Body: UpdateAboutInput }>, reply: FastifyReply) => {
    try {
      const data = await this.service.updateAbout(request.body);
      reply.send({
        success: true,
        message: 'About details updated successfully',
        data,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

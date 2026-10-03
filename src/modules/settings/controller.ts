import type { FastifyRequest, FastifyReply } from 'fastify';
import { SettingsService } from './service.js';
import type { UpdateSettingsInput } from './schema.js';

export class SettingsController {
  private service: SettingsService;

  constructor(fastify: any) {
    this.service = new SettingsService(fastify);
  }

  getSettings = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await this.service.getSettings();
      reply.send({ success: true, data: settings });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  updateSettings = async (request: FastifyRequest<{ Body: UpdateSettingsInput }>, reply: FastifyReply) => {
    try {
      const settings = await this.service.updateSettings(request.body);
      reply.send({ success: true, data: settings });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

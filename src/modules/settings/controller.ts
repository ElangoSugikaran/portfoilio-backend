import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { SettingsService } from './service.js';
import type { UpdateSettingsInput } from './schema.js';

/**
 * Controller handling HTTP requests and responses for Site Settings.
 */
export class SettingsController {
  private service: SettingsService;

  constructor(fastify: FastifyInstance) {
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
      reply.send({ 
        success: true, 
        message: 'Settings updated successfully', 
        data: settings 
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

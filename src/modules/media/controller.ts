import type { FastifyRequest, FastifyReply } from 'fastify';
import { MediaService } from './service.js';
import type { DeleteMediaParams } from './schema.js';

export class MediaController {
  private service: MediaService;

  constructor(fastify: any) {
    this.service = new MediaService(fastify);
  }

  upload = async (request: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ success: false, message: 'No file uploaded' });
      }

      const media = await this.service.uploadFile(file);
      reply.send({ success: true, data: media });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message || 'Upload failed' });
    }
  };

  delete = async (request: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const { id } = request.params as DeleteMediaParams;
      await this.service.deleteFile(id);
      reply.send({ success: true, message: 'Media deleted successfully' });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  };
}

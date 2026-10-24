import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { MediaService } from './service.js';
import type { DeleteMediaParams } from './schema.js';

/**
 * Controller handling multipart file uploads and media deletion.
 */
export class MediaController {
  private service: MediaService;

  constructor(fastify: FastifyInstance) {
    this.service = new MediaService(fastify);
  }

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ 
          success: false, 
          code: 'BAD_REQUEST',
          message: 'No file uploaded' 
        });
      }

      const media = await this.service.uploadFile(file);
      reply.status(201).send({ 
        success: true, 
        message: 'File uploaded successfully', 
        data: media 
      });
    } catch (error: any) {
      reply.status(500).send({ 
        success: false, 
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Upload failed' 
      });
    }
  };

  delete = async (request: FastifyRequest<{ Params: DeleteMediaParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await this.service.deleteFile(id);
      reply.send({ success: true, message: 'Media deleted successfully' });
    } catch (error: any) {
      reply.status(400).send({ 
        success: false, 
        code: 'BAD_REQUEST',
        message: error.message || 'Failed to delete media' 
      });
    }
  };
}

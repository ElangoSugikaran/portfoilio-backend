import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { MediaController } from './controller.js';
import { deleteMediaParamsSchema } from './schema.js';

/**
 * Media Routes
 * Manages multipart media file uploads (Sharp WebP + Cloudinary) and media deletion.
 */
export const mediaRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new MediaController(app);

  app.post('/upload', {
    schema: {
      tags: ['Media'],
      summary: 'Upload a media file (Image/Video/PDF)',
    },
    preValidation: [app.authenticate],
  }, controller.upload);

  app.delete('/:id', {
    schema: {
      tags: ['Media'],
      summary: 'Delete a media asset by ID',
      params: deleteMediaParamsSchema,
    },
    preValidation: [app.authenticate],
  }, controller.delete);
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { AboutController } from './controller.js';

/**
 * Public About Me routes.
 * Updates and CV management live under /api/v1/admin.
 */
export const aboutRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new AboutController(app);

  app.get('/', {
    schema: {
      tags: ['About'],
      summary: 'Get About Me information, CVs, and social links',
    },
  }, controller.getPublicAbout);

  app.get('/cv/download/:id', {
    schema: {
      tags: ['About'],
      summary: 'Download a CV as a PDF (use ?inline=true to preview)',
    },
  }, controller.downloadCv);
};

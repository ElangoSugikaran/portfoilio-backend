import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { AboutController } from './controller.js';
import { updateAboutSchema } from './schema.js';

export const aboutRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new AboutController(app);

  // Public: Get About Me details for public portfolio or initial admin view
  app.get('/', {
    schema: {
      tags: ['About'],
      summary: 'Get About Me information, CVs, and social links',
    },
  }, controller.getAbout);

  // Public alias for portfolio
  app.get('/public', {
    schema: {
      tags: ['About'],
      summary: 'Get public portfolio about information',
    },
  }, controller.getAbout);

  // Protected: Update About Me details (Admin authenticated)
  app.put('/', {
    schema: {
      tags: ['About'],
      summary: 'Update About Me profile details, social links, and CV documents',
      body: updateAboutSchema,
    },
    preValidation: [app.authenticate],
  }, controller.updateAbout);
};

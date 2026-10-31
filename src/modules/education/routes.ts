import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { EducationController } from './controller.js';
import { educationParamSchema, educationListQuerySchema } from './schema.js';

/**
 * Public education routes.
 * Create, update, reorder and delete operations live under /api/v1/admin/education.
 */
export const educationRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new EducationController(app);

  app.get('/', {
    schema: {
      tags: ['Education'],
      summary: 'Get all education entries',
      querystring: educationListQuerySchema,
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Education'],
      summary: 'Get an education entry by ID',
      params: educationParamSchema,
    },
  }, controller.getById);
};

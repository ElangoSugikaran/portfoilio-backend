import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExperienceController } from './controller.js';
import { experienceParamSchema } from './schema.js';

/**
 * Public work experience routes.
 * Create, update and delete operations live under /api/v1/admin/experience.
 */
export const experienceRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new ExperienceController(app);

  app.get('/', {
    schema: {
      tags: ['Experience'],
      summary: 'Get all work experience entries',
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Experience'],
      summary: 'Get an experience entry by ID',
      params: experienceParamSchema,
    },
  }, controller.getById);
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { SkillsController } from './controller.js';
import { skillParamSchema } from './schema.js';

/**
 * Public skills / technologies routes.
 * Create, update and delete operations live under /api/v1/admin/skills.
 */
export const skillsRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new SkillsController(app);

  app.get('/', {
    schema: {
      tags: ['Skills'],
      summary: 'Get all skills / technologies',
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Skills'],
      summary: 'Get a single skill by ID',
      params: skillParamSchema,
    },
  }, controller.getById);
};

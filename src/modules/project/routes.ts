import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ProjectController } from './controller.js';
import { projectParamSchema, projectListQuerySchema } from './schema.js';

/**
 * Public project routes.
 * Create, update and delete operations live under /api/v1/admin/projects.
 */
export const projectRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new ProjectController(app);

  app.get('/', {
    schema: {
      tags: ['Projects'],
      summary: 'Get projects with optional featured filtering and pagination',
      querystring: projectListQuerySchema,
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Projects'],
      summary: 'Get a single project by ID',
      params: projectParamSchema,
    },
  }, controller.getById);
};

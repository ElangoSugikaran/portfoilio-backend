import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ProjectController } from './controller.js';
import { createProjectSchema, updateProjectSchema, projectParamSchema } from './schema.js';

/**
 * Project Routes
 * Manages portfolio showcase projects, tags, media associations, and timeline phases.
 */
export const projectRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new ProjectController(app);

  // 🔓 Public:
  app.get('/', {
    schema: {
      tags: ['Projects'],
      summary: 'Get all projects',
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Projects'],
      summary: 'Get a single project by ID',
      params: projectParamSchema,
    },
  }, controller.getById);

  // 🔒 Protected:
  app.post('/', {
    schema: {
      tags: ['Projects'],
      summary: 'Create a new project',
      body: createProjectSchema,
    },
    preValidation: [app.authenticate],
  }, controller.create);
  
  app.put('/:id', {
    schema: {
      tags: ['Projects'],
      summary: 'Update an existing project by ID',
      params: projectParamSchema,
      body: updateProjectSchema,
    },
    preValidation: [app.authenticate],
  }, controller.update);
  
  app.delete('/:id', {
    schema: {
      tags: ['Projects'],
      summary: 'Delete a project by ID',
      params: projectParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.delete);
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { SkillsController } from './controller.js';
import { createSkillSchema, updateSkillSchema, skillParamSchema } from './schema.js';

/**
 * Skills / Technologies Routes
 * Manages technologies and skill tags displayed across projects and skills sections.
 */
export const skillsRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new SkillsController(app);

  app.get('/', {
    schema: {
      tags: ['Skills'],
      summary: 'Get all skills / technologies',
    },
    preValidation: [app.authenticate],
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Skills'],
      summary: 'Get a single skill by ID',
      params: skillParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.getById);

  app.post('/', {
    schema: {
      tags: ['Skills'],
      summary: 'Create a new skill',
      body: createSkillSchema,
    },
    preValidation: [app.authenticate],
  }, controller.create);
  
  app.put('/:id', {
    schema: {
      tags: ['Skills'],
      summary: 'Update a skill by ID',
      params: skillParamSchema,
      body: updateSkillSchema,
    },
    preValidation: [app.authenticate],
  }, controller.update);
  
  app.delete('/:id', {
    schema: {
      tags: ['Skills'],
      summary: 'Delete a skill by ID',
      params: skillParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.delete);
};

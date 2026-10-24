import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ExperienceController } from './controller.js';
import { createExperienceSchema, updateExperienceSchema, experienceParamSchema } from './schema.js';

/**
 * Experience Routes
 * Manages career milestones and work experience history.
 */
export const experienceRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new ExperienceController(app);

  app.get('/', {
    schema: {
      tags: ['Experience'],
      summary: 'Get all work experience entries',
    },
    preValidation: [app.authenticate],
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Experience'],
      summary: 'Get an experience entry by ID',
      params: experienceParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.getById);

  app.post('/', {
    schema: {
      tags: ['Experience'],
      summary: 'Create a new work experience entry',
      body: createExperienceSchema,
    },
    preValidation: [app.authenticate],
  }, controller.create);
  
  app.put('/:id', {
    schema: {
      tags: ['Experience'],
      summary: 'Update an experience entry by ID',
      params: experienceParamSchema,
      body: updateExperienceSchema,
    },
    preValidation: [app.authenticate],
  }, controller.update);
  
  app.delete('/:id', {
    schema: {
      tags: ['Experience'],
      summary: 'Delete an experience entry by ID',
      params: experienceParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.delete);
};

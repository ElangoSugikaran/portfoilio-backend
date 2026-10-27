import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { EducationController } from './controller.js';
import { createEducationSchema, updateEducationSchema, educationParamSchema, reorderEducationSchema } from './schema.js';

/**
 * Education Routes
 * Manages academic qualifications and degrees.
 */
export const educationRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new EducationController(app);

  // 🔓 Public:
  app.get('/', {
    schema: {
      tags: ['Education'],
      summary: 'Get all education entries',
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Education'],
      summary: 'Get an education entry by ID',
      params: educationParamSchema,
    },
  }, controller.getById);

  // 🔒 Protected:
  app.put('/reorder', {
    schema: {
      tags: ['Education'],
      summary: 'Reorder education entries in bulk',
      body: reorderEducationSchema,
    },
    preValidation: [app.authenticate],
  }, controller.reorder);

  app.post('/', {
    schema: {
      tags: ['Education'],
      summary: 'Create a new education entry',
      body: createEducationSchema,
    },
    preValidation: [app.authenticate],
  }, controller.create);
  
  app.put('/:id', {
    schema: {
      tags: ['Education'],
      summary: 'Update an education entry by ID',
      params: educationParamSchema,
      body: updateEducationSchema,
    },
    preValidation: [app.authenticate],
  }, controller.update);
  
  app.delete('/:id', {
    schema: {
      tags: ['Education'],
      summary: 'Delete an education entry by ID',
      params: educationParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.delete);
};

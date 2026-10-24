import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { CertificatesController } from './controller.js';
import { createCertificateSchema, updateCertificateSchema, certificateParamSchema } from './schema.js';

/**
 * Certificates Routes
 * Manages academic and digital certification credentials.
 */
export const certificatesRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new CertificatesController(app);

  app.get('/', {
    schema: {
      tags: ['Certificates'],
      summary: 'Get all certificates',
    },
    preValidation: [app.authenticate],
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Certificates'],
      summary: 'Get a certificate by ID',
      params: certificateParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.getById);

  app.post('/', {
    schema: {
      tags: ['Certificates'],
      summary: 'Create a new certificate',
      body: createCertificateSchema,
    },
    preValidation: [app.authenticate],
  }, controller.create);
  
  app.put('/:id', {
    schema: {
      tags: ['Certificates'],
      summary: 'Update a certificate by ID',
      params: certificateParamSchema,
      body: updateCertificateSchema,
    },
    preValidation: [app.authenticate],
  }, controller.update);
  
  app.delete('/:id', {
    schema: {
      tags: ['Certificates'],
      summary: 'Delete a certificate by ID',
      params: certificateParamSchema,
    },
    preValidation: [app.authenticate],
  }, controller.delete);
};

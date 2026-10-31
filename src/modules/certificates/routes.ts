import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { CertificatesController } from './controller.js';
import { certificateParamSchema } from './schema.js';

/**
 * Public certificate routes.
 * Create, update and delete operations live under /api/v1/admin/certificates.
 */
export const certificatesRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new CertificatesController(app);

  app.get('/', {
    schema: {
      tags: ['Certificates'],
      summary: 'Get all certificates',
    },
  }, controller.getAll);

  app.get('/:id', {
    schema: {
      tags: ['Certificates'],
      summary: 'Get a certificate by ID',
      params: certificateParamSchema,
    },
  }, controller.getById);
};

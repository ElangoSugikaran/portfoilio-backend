import type { FastifyInstance } from 'fastify';
import { CertificatesController } from './controller.js';
import { createCertificateSchema, updateCertificateSchema, certificateParamSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function certificatesRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new CertificatesController(server);

  typedServer.get('/', { preValidation: [server.authenticate] }, controller.getAll);
  typedServer.get('/:id', { 
    schema: { params: certificateParamSchema },
    preValidation: [server.authenticate] 
  }, controller.getById);

  typedServer.post('/', { 
    schema: { body: createCertificateSchema },
    preValidation: [server.authenticate] 
  }, controller.create);
  
  typedServer.put('/:id', { 
    schema: { params: certificateParamSchema, body: updateCertificateSchema },
    preValidation: [server.authenticate] 
  }, controller.update);
  
  typedServer.delete('/:id', { 
    schema: { params: certificateParamSchema },
    preValidation: [server.authenticate] 
  }, controller.delete);
}

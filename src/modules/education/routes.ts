import type { FastifyInstance } from 'fastify';
import { EducationController } from './controller.js';
import { createEducationSchema, updateEducationSchema, educationParamSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function educationRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new EducationController(server);

  typedServer.get('/', { preValidation: [server.authenticate] }, controller.getAll);
  typedServer.get('/:id', { 
    schema: { params: educationParamSchema },
    preValidation: [server.authenticate] 
  }, controller.getById);

  typedServer.post('/', { 
    schema: { body: createEducationSchema },
    preValidation: [server.authenticate] 
  }, controller.create);
  
  typedServer.put('/:id', { 
    schema: { params: educationParamSchema, body: updateEducationSchema },
    preValidation: [server.authenticate] 
  }, controller.update);
  
  typedServer.delete('/:id', { 
    schema: { params: educationParamSchema },
    preValidation: [server.authenticate] 
  }, controller.delete);
}

import type { FastifyInstance } from 'fastify';
import { ProjectController } from './controller.js';
import { createProjectSchema, updateProjectSchema, projectParamSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function projectRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new ProjectController(server);

  typedServer.get('/', { preValidation: [server.authenticate] }, controller.getAll);
  typedServer.get('/:id', { 
    schema: { params: projectParamSchema },
    preValidation: [server.authenticate] 
  }, controller.getById);

  typedServer.post('/', { 
    schema: { body: createProjectSchema },
    preValidation: [server.authenticate] 
  }, controller.create);
  
  typedServer.put('/:id', { 
    schema: { params: projectParamSchema, body: updateProjectSchema },
    preValidation: [server.authenticate] 
  }, controller.update);
  
  typedServer.delete('/:id', { 
    schema: { params: projectParamSchema },
    preValidation: [server.authenticate] 
  }, controller.delete);
}

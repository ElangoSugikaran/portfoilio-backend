import type { FastifyInstance } from 'fastify';
import { ExperienceController } from './controller.js';
import { createExperienceSchema, updateExperienceSchema, experienceParamSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function experienceRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new ExperienceController(server);

  typedServer.get('/', { preValidation: [server.authenticate] }, controller.getAll);
  typedServer.get('/:id', { 
    schema: { params: experienceParamSchema },
    preValidation: [server.authenticate] 
  }, controller.getById);

  typedServer.post('/', { 
    schema: { body: createExperienceSchema },
    preValidation: [server.authenticate] 
  }, controller.create);
  
  typedServer.put('/:id', { 
    schema: { params: experienceParamSchema, body: updateExperienceSchema },
    preValidation: [server.authenticate] 
  }, controller.update);
  
  typedServer.delete('/:id', { 
    schema: { params: experienceParamSchema },
    preValidation: [server.authenticate] 
  }, controller.delete);
}

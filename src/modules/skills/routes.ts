import type { FastifyInstance } from 'fastify';
import { SkillsController } from './controller.js';
import { createSkillSchema, updateSkillSchema, skillParamSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function skillsRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new SkillsController(server);

  // GET routes (Protected for admin view)
  typedServer.get('/', { preValidation: [server.authenticate] }, controller.getAll);
  typedServer.get('/:id', { 
    schema: { params: skillParamSchema },
    preValidation: [server.authenticate] 
  }, controller.getById);

  // Modification routes (Protected)
  typedServer.post('/', { 
    schema: { body: createSkillSchema },
    preValidation: [server.authenticate] 
  }, controller.create);
  
  typedServer.put('/:id', { 
    schema: { params: skillParamSchema, body: updateSkillSchema },
    preValidation: [server.authenticate] 
  }, controller.update);
  
  typedServer.delete('/:id', { 
    schema: { params: skillParamSchema },
    preValidation: [server.authenticate] 
  }, controller.delete);
}

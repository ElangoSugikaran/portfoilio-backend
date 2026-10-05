import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { MediaController } from './controller.js';
import { deleteMediaParamsSchema } from './schema.js';

export async function mediaRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new MediaController(server);

  typedServer.post('/upload', {
    preValidation: [server.authenticate]
  }, controller.upload);

  typedServer.delete('/:id', {
    schema: { params: deleteMediaParamsSchema },
    preValidation: [server.authenticate]
  }, controller.delete);
}

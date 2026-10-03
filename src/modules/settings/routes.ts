import type { FastifyInstance } from 'fastify';
import { SettingsController } from './controller.js';
import { updateSettingsSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function settingsRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new SettingsController(server);

  typedServer.get('/', { preValidation: [server.authenticate] }, controller.getSettings);
  
  typedServer.put('/', { 
    schema: { body: updateSettingsSchema },
    preValidation: [server.authenticate] 
  }, controller.updateSettings);
}

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { SettingsController } from './controller.js';
import { updateSettingsSchema } from './schema.js';

/**
 * Settings Routes
 * Manages singleton site metadata, about text, hero intro, and asset links.
 */
export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new SettingsController(app);

  // 🔓 Public:
  app.get('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Get site configuration and owner profile settings',
    },
  }, controller.getSettings);
  
  // 🔒 Protected:
  app.put('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Update site settings and metadata',
      body: updateSettingsSchema,
    },
    preValidation: [app.authenticate],
  }, controller.updateSettings);
};

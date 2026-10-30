import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { SettingsController } from './controller.js';
import { updateSettingsSchema } from './schema.js';

/**
 * Settings Routes
 * Manages site-wide display and SEO configuration. Personal profile data is managed by /about.
 */
export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new SettingsController(app);

  // 🔓 Public:
  app.get('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Get site-wide display and SEO settings',
    },
  }, controller.getSettings);
  
  // 🔒 Protected:
  app.put('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Update site-wide display and SEO settings',
      body: updateSettingsSchema,
    },
    preValidation: [app.authenticate],
  }, controller.updateSettings);
};

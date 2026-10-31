import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { SettingsController } from './controller.js';

/**
 * Public site settings routes.
 * Updates live under /api/v1/admin/settings.
 */
export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new SettingsController(app);

  app.get('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Get site-wide display and SEO settings',
    },
  }, controller.getPublicSettings);
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { DashboardController } from './controller.js';

/**
 * Dashboard Routes
 * Exposes admin dashboard statistics, metrics, and activity feeds.
 */
export const dashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new DashboardController(app);

  app.get('/', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get dashboard overview metrics, statistics, and recent activity',
    },
    preValidation: [app.authenticate],
  }, controller.getOverview);
};

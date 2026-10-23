import type { FastifyInstance } from 'fastify';
import { DashboardController } from './controller.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function dashboardRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new DashboardController(server);

  typedServer.get(
    '/',
    { preValidation: [server.authenticate] },
    controller.getOverview
  );
}

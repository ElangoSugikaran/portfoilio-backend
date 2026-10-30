import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { DashboardService } from './service.js';

/**
 * Controller handling Admin Dashboard overview and metrics aggregation.
 */
export class DashboardController {
  private service: DashboardService;

  constructor(fastify: FastifyInstance) {
    this.service = new DashboardService(fastify);
  }

  getOverview = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.service.getOverview();
      reply.send({ success: true, data });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to fetch dashboard overview',
      });
    }
  };
}

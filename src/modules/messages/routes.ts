import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { MessageController } from './controller.js';
import { createMessageSchema } from './schema.js';
import type { CreateMessageInput } from './schema.js';

/**
 * Public contact form route.
 * Reading, updating and deleting messages lives under /api/v1/admin/messages.
 */
export const messageRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new MessageController(app);

  // Visitor contact form: Max 5 submissions per minute per IP to prevent spam
  app.post<{ Body: CreateMessageInput }>('/', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      body: createMessageSchema,
      tags: ['Messages'],
      summary: 'Submit a new contact inquiry (Visitor)',
    },
  }, controller.create);
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { AuthController } from './controller.js';
import { loginSchema } from './schema.js';

/**
 * Public authentication routes.
 * Authenticated profile/password operations live under /api/v1/admin/auth.
 */
export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new AuthController(app);

  // Login: Strict rate limit (max 5 attempts per 15 minutes per IP) to prevent brute force
  app.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Admin login with email and password',
      body: loginSchema,
    },
  }, controller.login);

  app.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Clear admin session cookie',
    },
  }, controller.logout);
};

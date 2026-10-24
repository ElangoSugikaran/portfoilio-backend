import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { AuthController } from './controller.js';
import { loginSchema, updatePasswordSchema, updateProfileSchema } from './schema.js';

/**
 * Authentication Routes
 * Manages admin session lifecycle, password rotation, and profile credentials.
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

  // Protected route to get current admin profile (/me and /profile aliases)
  app.get('/profile', {
    schema: {
      tags: ['Auth'],
      summary: 'Get current admin profile',
    },
    preValidation: [app.authenticate],
  }, controller.getProfile);

  app.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Alias for /profile',
    },
    preValidation: [app.authenticate],
  }, controller.getProfile);

  // Protected route to update password
  app.put('/password', {
    schema: { 
      tags: ['Auth'],
      summary: 'Update admin password',
      body: updatePasswordSchema,
    },
    preValidation: [app.authenticate],
  }, controller.updatePassword);

  // Protected route to update admin profile (email/name)
  app.put('/profile', {
    schema: { 
      tags: ['Auth'],
      summary: 'Update admin profile information',
      body: updateProfileSchema,
    },
    preValidation: [app.authenticate],
  }, controller.updateProfile);
};

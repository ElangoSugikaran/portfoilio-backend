import type { FastifyInstance } from 'fastify';
import { AuthController } from './controller.js';
import { loginSchema, updatePasswordSchema, updateProfileSchema } from './schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function authRoutes(server: FastifyInstance) {
  const typedServer = server.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController(server);

  typedServer.post('/login', {
    schema: {
      body: loginSchema
    }
  }, controller.login);

  typedServer.post('/logout', controller.logout);

  // Protected route to get current admin profile (/me and /profile aliases)
  typedServer.get('/profile', {
    preValidation: [server.authenticate]
  }, controller.getProfile);

  typedServer.get('/me', {
    preValidation: [server.authenticate]
  }, controller.getProfile);

  // Protected route to update password
  typedServer.put('/password', {
    schema: { body: updatePasswordSchema },
    preValidation: [server.authenticate]
  }, controller.updatePassword);

  // Protected route to update admin profile (email/name)
  typedServer.put('/profile', {
    schema: { body: updateProfileSchema },
    preValidation: [server.authenticate]
  }, controller.updateProfile);
}

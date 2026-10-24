import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';

export default fp(async (server) => {
  await server.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {}
  });

  await server.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'admin_token',
      signed: false
    }
  });

  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in to continue.',
      });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

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
      reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

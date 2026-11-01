import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_IDLE_TIMEOUT_MS, hashSessionToken } from '../modules/auth/session.js';

export default fp(async (server) => {
  await server.register(fastifyCookie);
  server.decorateRequest('user', null as unknown as { id: string; email: string });

  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[ADMIN_SESSION_COOKIE];
    if (!token || token.length > 128) {
      return reply.status(401).send({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in to continue.',
      });
    }

    const tokenHash = hashSessionToken(token);
    const session = await server.prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { admin: { select: { id: true, email: true } } },
    });

    const now = new Date();
    const isExpired = !session ||
      session.expiresAt <= now ||
      session.lastSeenAt.getTime() <= now.getTime() - ADMIN_SESSION_IDLE_TIMEOUT_MS;

    if (isExpired) {
      if (session) {
        await server.prisma.adminSession.delete({ where: { id: session.id } });
      }
      return reply.status(401).send({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    const touched = await server.prisma.adminSession.updateMany({
      where: {
        id: session.id,
        expiresAt: { gt: now },
        lastSeenAt: { gt: new Date(now.getTime() - ADMIN_SESSION_IDLE_TIMEOUT_MS) },
      },
      data: { lastSeenAt: now },
    });
    if (touched.count !== 1) {
      return reply.status(401).send({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
      });
    }
    request.user = session.admin;
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: { id: string; email: string };
  }
}

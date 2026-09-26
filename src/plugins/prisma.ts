import fp from 'fastify-plugin';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '../config/env.js';

export default fp(async (server) => {
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  await prisma.$connect();
  
  // Make prisma available everywhere as `server.prisma`
  server.decorate('prisma', prisma);

  // Close database connection when server closes
  server.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
});

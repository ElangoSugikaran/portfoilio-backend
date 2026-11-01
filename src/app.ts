import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import errorHandlerPlugin from "./plugins/errorHandler.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import swaggerPlugin from "./plugins/swagger.js";
import { authRoutes } from "./modules/auth/routes.js";
import { skillsRoutes } from "./modules/skills/routes.js";
import { experienceRoutes } from "./modules/experience/routes.js";
import { certificatesRoutes } from "./modules/certificates/routes.js";
import { projectRoutes } from "./modules/project/routes.js";
import { settingsRoutes } from "./modules/settings/routes.js";
import { aboutRoutes } from "./modules/about/routes.js";
import { educationRoutes } from "./modules/education/routes.js";
import { messageRoutes } from "./modules/messages/routes.js";
import { adminRoutes } from "./routes/admin/index.js";
import { env } from "./config/env.js";

export async function buildApp() {
  const app = Fastify({
    trustProxy: env.NODE_ENV === 'production',
    logger: {
      redact: [
        'req.headers.cookie',
        'req.headers.authorization',
        'req.body.password',
        'req.body.currentPassword',
        'req.body.newPassword',
      ],
    },
  }).withTypeProvider<ZodTypeProvider>();
  const allowedOrigins = new Set(env.CORS_ORIGINS);
  const allowedAdminOrigins = new Set(env.ADMIN_ORIGINS);

  // Add Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register security plugins
  // Keep CSP active in production. Swagger is only enabled in development.
  await app.register(helmet, env.NODE_ENV === 'production' ? {} : { contentSecurityPolicy: false });

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      return reply.status(403).send({
        success: false,
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'This origin is not allowed to access the API.',
      });
    }

    // Cookies are sent automatically by browsers. Require an allowed Origin for
    // state-changing admin requests to prevent cross-site request forgery.
    if (
      (request.url === '/api/v1/admin' || request.url.startsWith('/api/v1/admin/')) &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
      (!origin || !allowedAdminOrigins.has(origin))
    ) {
      return reply.status(403).send({
        success: false,
        code: 'ADMIN_ORIGIN_NOT_ALLOWED',
        message: 'This request must come from the configured admin dashboard origin.',
      });
    }
  });

  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['Content-Disposition'],
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // ⏱️ Register Rate Limiting Plugin (DDoS & Brute-force protection)
  await app.register(rateLimitPlugin);

  // 📖 Register Swagger / OpenAPI Plugin (Interactive Docs at /api/v1/docs)
  if (env.NODE_ENV !== 'production') {
    await app.register(swaggerPlugin);
  }

  // 🔌 Register the Database Connection
  await app.register(prismaPlugin);

  // 🔐 Register Auth Plugin
  await app.register(authPlugin);

  // 🛡️ Register Global Error Handler Plugin
  await app.register(errorHandlerPlugin);

  app.addHook('onSend', async (request, reply, payload) => {
    if (request.url === '/api/v1/admin' || request.url.startsWith('/api/v1/admin/')) {
      reply.header('Cache-Control', 'no-store');
    }
    return payload;
  });

  // 🚀 Register Routes (API v1)
  // Login/logout use the admin API namespace, but remain outside adminRoutes
  // so the authentication hook does not block users who need to log in.
  await app.register(authRoutes, { prefix: '/api/v1/admin/auth' });
  await app.register(skillsRoutes, { prefix: '/api/v1/skills' });
  await app.register(experienceRoutes, { prefix: '/api/v1/experience' });
  await app.register(certificatesRoutes, { prefix: '/api/v1/certificates' });
  await app.register(projectRoutes, { prefix: '/api/v1/projects' });
  await app.register(settingsRoutes, { prefix: '/api/v1/settings' });
  await app.register(aboutRoutes, { prefix: '/api/v1/about' });
  await app.register(educationRoutes, { prefix: '/api/v1/education' });
  await app.register(messageRoutes, { prefix: '/api/v1/messages' });

  // All admin-only endpoints share one router-level authentication hook.
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  // Root route so localhost:8000 doesn't return 404
  app.get("/", async () => {
    return {
      message: "Welcome to the Portfolio Backend API",
      version: "v1",
      docs: "/api/v1/docs"
    };
  });

  // Basic health-check route
  app.get("/health", async () => {
    return { status: "ok", message: "Server and DB are healthy!" };
  });

  return app;
}

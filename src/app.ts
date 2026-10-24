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
import { mediaRoutes } from "./modules/media/routes.js";
import { educationRoutes } from "./modules/education/routes.js";
import { messageRoutes } from "./modules/messages/routes.js";
import { dashboardRoutes } from "./modules/dashboard/routes.js";

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // Add Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register security plugins
  // Note: contentSecurityPolicy is disabled to allow Swagger UI scripts and inline stylesheets
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // ⏱️ Register Rate Limiting Plugin (DDoS & Brute-force protection)
  await app.register(rateLimitPlugin);

  // 📖 Register Swagger / OpenAPI Plugin (Interactive Docs at /api/v1/docs)
  await app.register(swaggerPlugin);

  // 🔌 Register the Database Connection
  await app.register(prismaPlugin);

  // 🔐 Register Auth Plugin
  await app.register(authPlugin);

  // 🛡️ Register Global Error Handler Plugin
  await app.register(errorHandlerPlugin);

  // 🚀 Register Routes (API v1)
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(skillsRoutes, { prefix: '/api/v1/skills' });
  await app.register(experienceRoutes, { prefix: '/api/v1/experience' });
  await app.register(certificatesRoutes, { prefix: '/api/v1/certificates' });
  await app.register(projectRoutes, { prefix: '/api/v1/projects' });
  await app.register(settingsRoutes, { prefix: '/api/v1/settings' });
  await app.register(mediaRoutes, { prefix: '/api/v1/media' });
  await app.register(educationRoutes, { prefix: '/api/v1/education' });
  await app.register(messageRoutes, { prefix: '/api/v1/messages' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });

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

import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '../config/env.js';

/**
 * Swagger & OpenAPI 3.0 Documentation Plugin
 * Generates an interactive API documentation interface powered by Zod schemas.
 * Accessible at: http://localhost:<PORT>/api/v1/docs
 * 100% Free & Open Source (Self-hosted inside Fastify).
 */
export default fp(async (server) => {
  // 1. Register OpenAPI Schema Generator
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Portfolio Full-Stack API',
        description: 'Interactive API documentation for Portfolio administration and public clients.',
        version: '1.0.0',
        contact: {
          name: 'Portfolio Admin',
          email: env.CONTACT_EMAIL_TO,
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Local Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token as: Bearer <token>',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'admin_token',
            description: 'HTTP-Only session cookie',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  // 2. Register Interactive Swagger UI Webpage
  await server.register(fastifySwaggerUi, {
    routePrefix: '/api/v1/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
});

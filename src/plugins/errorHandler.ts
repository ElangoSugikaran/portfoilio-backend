import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../lib/errors.js';
import { env } from '../config/env.js';

/**
 * Global Error Handler Plugin
 * Captures all uncaught errors, Zod validation errors, and Prisma errors,
 * transforming them into
 * a predictable JSON structure designed for frontend toaster notifications.
 */
const errorHandlerPlugin: FastifyPluginAsync = async (server) => {
  server.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // 1. Handle Known AppError
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    // 2. Handle Fastify / Zod Schema Validation Errors
    const isValidationError = 
      'validation' in error || 
      error.name === 'ZodError' || 
      (error as any).issues !== undefined;

    if (isValidationError) {
      const issues = (error as any).issues || (error as any).validation;
      const firstIssue = Array.isArray(issues) && issues.length > 0 ? issues[0] : null;
      const message = firstIssue?.message 
        ? `${firstIssue.path ? `${firstIssue.path.join('.')}: ` : ''}${firstIssue.message}`
        : error.message || 'Validation failed';

      return reply.status(400).send({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `Validation error: ${message}`,
        errors: issues,
      });
    }

    // 3. Handle Prisma ORM Database Errors (P-codes)
    const prismaCode = (error as any).code;
    if (typeof prismaCode === 'string' && prismaCode.startsWith('P')) {
      switch (prismaCode) {
        case 'P2002': {
          const target = (error as any).meta?.target;
          const field = Array.isArray(target) ? target.join(', ') : target || 'field';
          return reply.status(400).send({
            success: false,
            code: 'DUPLICATE_ENTRY',
            message: `A record with this ${field} already exists.`,
          });
        }
        case 'P2025': {
          return reply.status(404).send({
            success: false,
            code: 'NOT_FOUND',
            message: 'The requested record was not found.',
          });
        }
        case 'P2003': {
          return reply.status(409).send({
            success: false,
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Operation failed because related records depend on this resource.',
          });
        }
        default: {
          request.log.error(error, `Prisma Database Error: ${prismaCode}`);
          return reply.status(500).send({
            success: false,
            code: 'DATABASE_ERROR',
            message: env.NODE_ENV === 'production' 
              ? 'A database error occurred.' 
              : error.message,
          });
        }
      }
    }

    // 4. Default Internal Server Error (500)
    request.log.error(error, 'Unhandled Server Exception');
    
    const statusCode = (error as FastifyError).statusCode || 500;
    const message = env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected server error occurred. Please try again later.'
      : error.message || 'Internal Server Error';

    return reply.status(statusCode).send({
      success: false,
      code: (error as any).code || 'INTERNAL_SERVER_ERROR',
      message,
    });
  });

  // 404 Route Not Found Handler
  server.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      success: false,
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${request.method} ${request.url} not found`,
    });
  });
};

export default fp(errorHandlerPlugin);

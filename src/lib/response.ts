import type { FastifyReply } from 'fastify';

/**
 * Standard API Response Envelope
 * Ensures consistent response format across all endpoints for frontend consumption.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: unknown;
}

/**
 * Send standard success response (200 OK)
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data?: T,
  message?: string
) {
  return reply.status(200).send({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  });
}

/**
 * Send standard created response (201 Created)
 */
export function sendCreated<T>(
  reply: FastifyReply,
  data?: T,
  message?: string
) {
  return reply.status(201).send({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  });
}

/**
 * Send standard error response
 */
export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  errors?: unknown
) {
  return reply.status(statusCode).send({
    success: false,
    code,
    message,
    ...(errors !== undefined ? { errors } : {}),
  });
}

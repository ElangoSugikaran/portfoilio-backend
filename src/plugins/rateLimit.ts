import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

/**
 * Rate Limiting Plugin
 * Protects endpoints from DDoS, brute-force attacks, and spam.
 * Provides custom 429 response envelope compatible with frontend toaster notifications.
 */
export default fp(async (server) => {
  await server.register(rateLimit, {
    global: true,
    max: 100, // Global limit: 100 requests
    timeWindow: '1 minute', // Per minute per IP
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (request, context) => ({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests from your IP. Please slow down and try again in ${context.after}.`,
    }),
  });
});

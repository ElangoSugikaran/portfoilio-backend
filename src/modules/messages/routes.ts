import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { MessageController } from './controller.js';
import { createMessageSchema, updateMessageSchema, messageParamSchema } from './schema.js';
import type { CreateMessageInput, UpdateMessageInput } from './schema.js';

export const messageRoutes: FastifyPluginAsyncZod = async (app) => {
  const controller = new MessageController(app);

  app.post<{ Body: CreateMessageInput }>('/', {
    schema: {
      body: createMessageSchema,
      tags: ['Messages'],
      summary: 'Create a new contact message'
    }
  }, controller.create);

  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['Messages'],
      summary: 'Get all messages (Admin)'
    }
  }, controller.getAll);

  app.patch<{ Params: { id: string }; Body: UpdateMessageInput }>('/:id', {
    onRequest: [app.authenticate],
    schema: {
      params: messageParamSchema,
      body: updateMessageSchema,
      tags: ['Messages'],
      summary: 'Update message status (Admin)'
    }
  }, controller.update);

  app.delete<{ Params: { id: string } }>('/:id', {
    onRequest: [app.authenticate],
    schema: {
      params: messageParamSchema,
      tags: ['Messages'],
      summary: 'Delete message (Admin)'
    }
  }, controller.delete);
};

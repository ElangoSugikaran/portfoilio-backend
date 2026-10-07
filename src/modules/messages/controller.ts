import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { MessageService } from './service.js';
import type { CreateMessageInput, UpdateMessageInput } from './schema.js';

export class MessageController {
  private service: MessageService;

  constructor(fastify: FastifyInstance) {
    this.service = new MessageService(fastify);
  }

  getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const messages = await this.service.getAll();
      reply.send(messages);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateMessageInput }>, reply: FastifyReply) => {
    try {
      const message = await this.service.create(request.body);
      reply.status(201).send(message);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  };

  update = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateMessageInput }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const message = await this.service.update(id, request.body);
      reply.send(message);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  };

  delete = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const message = await this.service.delete(id);
      reply.send(message);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  };
}

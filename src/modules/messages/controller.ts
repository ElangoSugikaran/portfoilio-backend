import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { MessageService } from './service.js';
import type { CreateMessageInput, UpdateMessageInput } from './schema.js';

/**
 * Controller handling contact inquiries and messages.
 * Formats standardized JSON responses for portfolio visitor feedback and admin dashboard.
 */
export class MessageController {
  private service: MessageService;

  constructor(fastify: FastifyInstance) {
    this.service = new MessageService(fastify);
  }

  getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const messages = await this.service.getAll();
      reply.send({ success: true, data: messages });
    } catch (error: any) {
      reply.status(500).send({ 
        success: false, 
        code: 'INTERNAL_SERVER_ERROR', 
        message: error.message || 'Failed to fetch messages' 
      });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateMessageInput }>, reply: FastifyReply) => {
    try {
      const message = await this.service.create(request.body);
      reply.status(201).send({ 
        success: true, 
        message: 'Your message has been sent successfully. Thank you for reaching out!',
        data: message 
      });
    } catch (error: any) {
      reply.status(500).send({ 
        success: false, 
        code: 'INTERNAL_SERVER_ERROR', 
        message: error.message || 'Failed to send message' 
      });
    }
  };

  update = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateMessageInput }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const message = await this.service.update(id, request.body);
      reply.send({ 
        success: true, 
        message: 'Message status updated successfully', 
        data: message 
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Message not found' });
      }
      reply.status(500).send({ 
        success: false, 
        code: 'INTERNAL_SERVER_ERROR', 
        message: error.message || 'Failed to update message' 
      });
    }
  };

  delete = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      await this.service.delete(id);
      reply.send({ success: true, message: 'Message deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Message not found' });
      }
      reply.status(500).send({ 
        success: false, 
        code: 'INTERNAL_SERVER_ERROR', 
        message: error.message || 'Failed to delete message' 
      });
    }
  };
}

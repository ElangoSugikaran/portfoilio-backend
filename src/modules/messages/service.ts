import type { FastifyInstance } from 'fastify';
import type { CreateMessageInput, UpdateMessageInput } from './schema.js';
import { EmailService } from '../../services/email.service.js';

/**
 * Service managing contact form messages and asynchronous notification emails.
 */
export class MessageService {
  private emailService: EmailService;

  constructor(private fastify: FastifyInstance) {
    this.emailService = new EmailService();
  }

  async getAll() {
    return await this.fastify.prisma.message.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: CreateMessageInput) {
    // 1. Save to database as PENDING
    const message = await this.fastify.prisma.message.create({
      data: {
        ...data,
        emailStatus: 'PENDING'
      }
    });

    // 2. Try sending the email asynchronously without blocking HTTP response
    this.emailService.sendContactNotification(data).then(async (result) => {
      // 3. Update the database status based on email delivery success
      await this.fastify.prisma.message.update({
        where: { id: message.id },
        data: {
          emailStatus: result.success ? 'SENT' : 'FAILED'
        }
      });
    }).catch((err) => {
      this.fastify.log.error(err, 'Failed to process email notification for message');
    });

    return message;
  }

  async update(id: string, data: UpdateMessageInput) {
    return await this.fastify.prisma.message.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await this.fastify.prisma.message.delete({
      where: { id }
    });
  }
}

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { CvService, type CvUploadInput } from './service.js';
import type { CvParams } from './schema.js';
import { AppError } from '../../lib/errors.js';

interface ParsedCvMultipart {
  buffer?: Buffer;
  fileName?: string;
  mimetype?: string;
  title?: string;
}

export class CvController {
  private service: CvService;

  constructor(fastify: FastifyInstance) {
    this.service = new CvService(fastify);
  }

  private async parseMultipart(request: FastifyRequest): Promise<ParsedCvMultipart> {
    const result: ParsedCvMultipart = {};

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (part.fieldname === 'file' && !result.buffer) {
          result.buffer = await part.toBuffer();
          result.fileName = part.filename;
          result.mimetype = part.mimetype;
        } else {
          await part.toBuffer();
        }
      } else if (part.fieldname === 'title') {
        result.title = String(part.value ?? '').trim();
      }
    }

    return result;
  }

  private sendError(reply: FastifyReply, error: unknown) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        code: error.code,
        message: error.message,
      });
    }
    const message = error instanceof Error ? error.message : 'CV operation failed';
    return reply.status(500).send({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message,
    });
  }

  list = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.service.list();
      reply.send({ success: true, data });
    } catch (error) {
      this.sendError(reply, error);
    }
  };

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = await this.parseMultipart(request);
      if (!parsed.buffer || !parsed.fileName || !parsed.mimetype) {
        throw AppError.badRequest('No PDF file uploaded.');
      }

      const input: CvUploadInput = {
        buffer: parsed.buffer,
        fileName: parsed.fileName,
        mimetype: parsed.mimetype,
        title: parsed.title,
      };

      const data = await this.service.upload(input);
      reply.status(201).send({ success: true, message: 'CV uploaded successfully', data });
    } catch (error: any) {
      if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
        return reply.status(400).send({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'CV file size must not exceed 10MB.',
        });
      }
      this.sendError(reply, error);
    }
  };

  update = async (request: FastifyRequest<{ Params: CvParams }>, reply: FastifyReply) => {
    try {
      const parsed = await this.parseMultipart(request);
      const data = await this.service.update(request.params.id, {
        ...(parsed.buffer ? { buffer: parsed.buffer } : {}),
        ...(parsed.fileName ? { fileName: parsed.fileName } : {}),
        ...(parsed.mimetype ? { mimetype: parsed.mimetype } : {}),
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      });
      reply.send({ success: true, message: 'CV updated successfully', data });
    } catch (error: any) {
      if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
        return reply.status(400).send({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'CV file size must not exceed 10MB.',
        });
      }
      this.sendError(reply, error);
    }
  };

  setPrimary = async (request: FastifyRequest<{ Params: CvParams }>, reply: FastifyReply) => {
    try {
      const data = await this.service.setPrimary(request.params.id);
      reply.send({ success: true, message: 'Primary CV updated', data });
    } catch (error) {
      this.sendError(reply, error);
    }
  };

  delete = async (request: FastifyRequest<{ Params: CvParams }>, reply: FastifyReply) => {
    try {
      await this.service.delete(request.params.id);
      reply.send({ success: true, message: 'CV deleted successfully' });
    } catch (error) {
      this.sendError(reply, error);
    }
  };

  download = async (request: FastifyRequest<{ Params: CvParams }>, reply: FastifyReply) => {
    try {
      const { buffer, filename } = await this.service.download(request.params.id);
      const asciiName = filename.replace(/[^\x20-\x7E]/g, '_');

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Length', buffer.length)
        .header(
          'Content-Disposition',
          `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        )
        .send(buffer);
    } catch (error) {
      this.sendError(reply, error);
    }
  };
}

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AboutService } from './service.js';
import type { UpdateAboutInput } from './schema.js';
import { z } from 'zod';

const downloadCvSchema = z.object({
  id: z.string().cuid('Invalid CV document ID'),
});

type DownloadCvParams = z.infer<typeof downloadCvSchema>;

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim() || undefined;
}

function getBaseUrl(request: FastifyRequest): string {
  const protocol = firstHeaderValue(request.headers['x-forwarded-proto']) || request.protocol;
  const host =
    firstHeaderValue(request.headers['x-forwarded-host']) ||
    request.headers.host ||
    request.hostname;
  return `${protocol}://${host}`;
}

export class AboutController {
  private service: AboutService;

  constructor(fastify: FastifyInstance) {
    this.service = new AboutService(fastify);
  }

  getAbout = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.service.getAbout(getBaseUrl(request));
      reply.send({ success: true, data });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getPublicAbout = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await this.service.getAbout(getBaseUrl(request), true);
      reply.send({ success: true, data });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  downloadCv = async (
    request: FastifyRequest<{ Params: DownloadCvParams; Querystring: { inline?: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const { buffer, filename } = await this.service.getCvFile(request.params.id);
      const disposition = request.query?.inline === 'true' ? 'inline' : 'attachment';
      const asciiName = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Length', buffer.length)
        .header(
          'Content-Disposition',
          `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        )
        .header('Cache-Control', 'no-store')
        .send(buffer);
    } catch (error: any) {
      const status = typeof error?.statusCode === 'number' ? error.statusCode : 500;
      reply.status(status).send({
        success: false,
        code: status === 404 ? 'NOT_FOUND' : 'CV_DOWNLOAD_FAILED',
        message: error.message,
      });
    }
  };

  updateAbout = async (request: FastifyRequest<{ Body: UpdateAboutInput }>, reply: FastifyReply) => {
    try {
      const data = await this.service.updateAbout(request.body, getBaseUrl(request));
      reply.send({
        success: true,
        message: 'About details updated successfully',
        data,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

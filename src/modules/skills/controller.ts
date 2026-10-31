import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { SkillsService } from './service.js';
import type { CreateSkillInput, UpdateSkillInput } from './schema.js';

function toPublicSkill(skill: any) {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    icon: skill.icon,
  };
}

/**
 * Controller handling HTTP requests and responses for the Skills module.
 * Formats responses for frontend consumption and toast notifications.
 */
export class SkillsController {
  private service: SkillsService;

  constructor(fastify: FastifyInstance) {
    this.service = new SkillsService(fastify);
  }

  getAll = async (
    request: FastifyRequest<{ Querystring: { all?: string; showInSkills?: string } }>, 
    reply: FastifyReply
  ) => {
    try {
      const isAdmin = Boolean(request.user);
      const showInSkills = isAdmin
        ? request.query?.all === 'true'
          ? undefined
          : request.query?.showInSkills !== undefined
            ? request.query.showInSkills === 'true'
            : true
        : true;
      const skills = await this.service.getAll(showInSkills !== undefined ? { showInSkills } : undefined);
      reply.send({
        success: true,
        data: isAdmin ? skills : skills.map(toPublicSkill),
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const skill = await this.service.getById(request.params.id);
      if (!skill || (!skill.showInSkills && !request.user)) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Skill not found' });
      }
      reply.send({ success: true, data: request.user ? skill : toPublicSkill(skill) });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateSkillInput }>, reply: FastifyReply) => {
    try {
      const skill = await this.service.create(request.body);
      reply.status(201).send({ 
        success: true, 
        message: 'Skill created successfully', 
        data: skill 
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'A skill with this name already exists' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  update = async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateSkillInput }>, reply: FastifyReply) => {
    try {
      const skill = await this.service.update(request.params.id, request.body);
      reply.send({ 
        success: true, 
        message: 'Skill updated successfully', 
        data: skill 
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Skill not found' });
      }
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'A skill with this name already exists' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  delete = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await this.service.delete(request.params.id);
      reply.send({ success: true, message: 'Skill deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Skill not found' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

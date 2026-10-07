import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './service.js';
import type { LoginInput, UpdatePasswordInput, UpdateProfileInput } from './schema.js';

export class AuthController {
  private service: AuthService;

  constructor(fastify: any) {
    this.service = new AuthService(fastify);
  }

  login = async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
    try {
      const { admin, token } = await this.service.login(request.body);

      // Set cookie and respond
      reply
        .setCookie('admin_token', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        })
        .send({ success: true, admin, token });
    } catch (error: any) {
      reply.status(401).send({ success: false, message: error.message || 'Authentication failed' });
    }
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    reply
      .clearCookie('admin_token', { path: '/' })
      .send({ success: true, message: 'Logged out successfully' });
  };
  
  me = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ success: true, admin: request.user });
  }

  updatePassword = async (request: FastifyRequest<{ Body: UpdatePasswordInput }>, reply: FastifyReply) => {
    try {
      const adminId = (request.user as any).id;
      await this.service.updatePassword(adminId, request.body);
      reply.send({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      reply.status(400).send({ success: false, code: 'BAD_REQUEST', message: error.message });
    }
  };

  updateProfile = async (request: FastifyRequest<{ Body: UpdateProfileInput }>, reply: FastifyReply) => {
    try {
      const adminId = (request.user as any).id;
      const updatedAdmin = await this.service.updateProfile(adminId, request.body);
      
      // Re-sign token if email changed (since email is in the JWT payload)
      const newToken = (this as any).service.fastify.jwt.sign({ 
        id: updatedAdmin.id, 
        email: updatedAdmin.email 
      });

      reply
        .setCookie('admin_token', newToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 
        })
        .send({ success: true, admin: updatedAdmin, token: newToken });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'Email is already in use' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

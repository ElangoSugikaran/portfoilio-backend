import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AuthService } from './service.js';
import type { LoginInput, UpdatePasswordInput, UpdateProfileInput } from './schema.js';

/**
 * Controller handling authentication operations (login, logout, profile, password).
 * Sets secure HTTP-Only cookies and returns standardized payloads for UI toast notifications.
 */
export class AuthController {
  private service: AuthService;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.service = new AuthService(fastify);
    this.fastify = fastify;
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
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        })
        .send({ 
          success: true, 
          message: 'Logged in successfully', 
          admin, 
          token 
        });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return reply.status(401).send({ 
          success: false, 
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password' 
        });
      }
      request.log.error(error, 'Error during login');
      reply.status(500).send({ 
        success: false, 
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error during login. Please try again.' 
      });
    }
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    reply
      .clearCookie('admin_token', { path: '/' })
      .send({ success: true, message: 'Logged out successfully' });
  };
  
  getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = request.user.id;
      const admin = await this.service.getProfile(adminId);
      if (!admin) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Admin not found' });
      }
      reply.send({ success: true, data: admin });
    } catch (error: any) {
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };

  updatePassword = async (request: FastifyRequest<{ Body: UpdatePasswordInput }>, reply: FastifyReply) => {
    try {
      const adminId = request.user.id;
      await this.service.updatePassword(adminId, request.body);
      reply.send({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      reply.status(400).send({ success: false, code: 'BAD_REQUEST', message: error.message });
    }
  };

  updateProfile = async (request: FastifyRequest<{ Body: UpdateProfileInput }>, reply: FastifyReply) => {
    try {
      const adminId = request.user.id;
      const updatedAdmin = await this.service.updateProfile(adminId, request.body);
      
      // Re-sign token if email changed (since email is in the JWT payload)
      const newToken = this.fastify.jwt.sign({ 
        id: updatedAdmin.id, 
        email: updatedAdmin.email 
      });

      reply
        .setCookie('admin_token', newToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 
        })
        .send({ 
          success: true, 
          message: 'Profile updated successfully', 
          admin: updatedAdmin, 
          token: newToken 
        });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'Email is already in use' });
      }
      reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  };
}

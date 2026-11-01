import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AuthService } from './service.js';
import type { LoginInput, UpdatePasswordInput, UpdateProfileInput } from './schema.js';
import { env } from '../../config/env.js';
import { ADMIN_COOKIE_PATH, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from './session.js';

const cookieOptions = {
  path: ADMIN_COOKIE_PATH,
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

export class AuthController {
  private service: AuthService;

  constructor(fastify: FastifyInstance) {
    this.service = new AuthService(fastify);
  }

  login = async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
    try {
      const { admin, token } = await this.service.login(request.body);
      return reply
        .setCookie(ADMIN_SESSION_COOKIE, token, cookieOptions)
        .send({ success: true, message: 'Logged in successfully', admin });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return reply.status(401).send({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }
      request.log.error({ err: error }, 'Error during login');
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error during login. Please try again.',
      });
    }
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await this.service.logout(request.cookies[ADMIN_SESSION_COOKIE]);
      return reply.clearCookie(ADMIN_SESSION_COOKIE, { ...cookieOptions, maxAge: undefined })
        .send({ success: true, message: 'Logged out successfully' });
    } catch (error: unknown) {
      request.log.error({ err: error }, 'Error during logout');
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not end the session. Please try again.',
      });
    }
  };

  getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const admin = await this.service.getProfile(request.user.id);
      if (!admin) {
        return reply.status(404).send({ success: false, code: 'NOT_FOUND', message: 'Admin not found' });
      }
      return reply.send({ success: true, data: admin });
    } catch (error: unknown) {
      request.log.error({ err: error }, 'Error loading admin profile');
      return reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Could not load profile' });
    }
  };

  updatePassword = async (request: FastifyRequest<{ Body: UpdatePasswordInput }>, reply: FastifyReply) => {
    try {
      const { token } = await this.service.updatePassword(request.user.id, request.body);
      return reply
        .setCookie(ADMIN_SESSION_COOKIE, token, cookieOptions)
        .send({ success: true, message: 'Password updated successfully. Other sessions have been signed out.' });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Incorrect current password') {
        return reply.status(400).send({ success: false, code: 'BAD_REQUEST', message: error.message });
      }
      request.log.error({ err: error }, 'Error updating admin password');
      return reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Could not update password' });
    }
  };

  updateProfile = async (request: FastifyRequest<{ Body: UpdateProfileInput }>, reply: FastifyReply) => {
    try {
      const updatedAdmin = await this.service.updateProfile(request.user.id, request.body);
      return reply.send({ success: true, message: 'Profile updated successfully', admin: updatedAdmin });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return reply.status(400).send({ success: false, code: 'DUPLICATE_ENTRY', message: 'Email is already in use' });
      }
      request.log.error({ err: error }, 'Error updating admin profile');
      return reply.status(500).send({ success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Could not update profile' });
    }
  };
}

import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { LoginInput, UpdatePasswordInput, UpdateProfileInput } from './schema.js';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async login(input: LoginInput) {
    const admin = await (this.fastify as any).prisma.admin.findUnique({
      where: { email: input.email }
    });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Sign token payload
    const token = this.fastify.jwt.sign({ 
      id: admin.id, 
      email: admin.email 
    });

    return { 
      admin: { id: admin.id, email: admin.email, name: admin.name }, 
      token 
    };
  }

  async updatePassword(adminId: string, input: UpdatePasswordInput) {
    const admin = await (this.fastify as any).prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isValid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new Error('Incorrect current password');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

    await (this.fastify as any).prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash: newPasswordHash }
    });

    return true;
  }

  async updateProfile(adminId: string, input: UpdateProfileInput) {
    const admin = await (this.fastify as any).prisma.admin.update({
      where: { id: adminId },
      data: {
        email: input.email,
        name: input.name
      }
    });

    return { id: admin.id, email: admin.email, name: admin.name };
  }
}

import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { LoginInput, UpdatePasswordInput, UpdateProfileInput } from './schema.js';
import { deleteMediaAsset } from '../../services/media-asset.service.js';

/**
 * Service managing admin authentication, password hashing, and credentials.
 */
export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async login(input: LoginInput) {
    const admin = await this.fastify.prisma.admin.findUnique({
      where: { email: input.email },
      include: { profileImage: true }
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
      admin: { 
        id: admin.id, 
        email: admin.email, 
        name: admin.name,
        profileImageId: admin.profileImageId,
        profileImage: admin.profileImage 
      }, 
      token 
    };
  }

  async getProfile(adminId: string) {
    const admin = await this.fastify.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImageId: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return admin;
  }

  async updatePassword(adminId: string, input: UpdatePasswordInput) {
    const admin = await this.fastify.prisma.admin.findUnique({
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

    await this.fastify.prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash: newPasswordHash }
    });

    return true;
  }

  async updateProfile(adminId: string, input: UpdateProfileInput) {
    const updateData: { email?: string; name?: string | null; profileImageId?: string | null } = {};
    if (input.email !== undefined) updateData.email = input.email;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.profileImageId !== undefined) {
      updateData.profileImageId = input.profileImageId;
    }

    const existing = await this.fastify.prisma.admin.findUnique({
      where: { id: adminId },
      select: { profileImageId: true },
    });

    const admin = await this.fastify.prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        profileImageId: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (input.profileImageId !== undefined && input.profileImageId !== existing?.profileImageId) {
      await deleteMediaAsset(this.fastify.prisma, existing?.profileImageId, this.fastify.log);
    }

    return admin;
  }
}

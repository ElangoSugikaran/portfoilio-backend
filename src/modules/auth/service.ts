import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import type { LoginInput, UpdatePasswordInput, UpdateProfileInput } from './schema.js';
import { deleteMediaAsset } from '../../services/media-asset.service.js';
import { ADMIN_SESSION_MAX_AGE_SECONDS, hashSessionToken } from './session.js';

// Use the same expensive password check when an email is unknown to reduce
// account enumeration through response timing.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-admin-password', 12);

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
    const isValid = await bcrypt.compare(input.password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!admin || !isValid) {
      throw new Error('Invalid credentials');
    }

    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    await this.fastify.prisma.adminSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { lastSeenAt: { lte: new Date(now.getTime() - 30 * 60 * 1000) } },
        ],
      },
    });
    await this.fastify.prisma.adminSession.create({
      data: {
        tokenHash: hashSessionToken(token),
        adminId: admin.id,
        expiresAt: new Date(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000),
      },
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

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    await this.fastify.prisma.$transaction([
      this.fastify.prisma.admin.update({
        where: { id: adminId },
        data: { passwordHash: newPasswordHash },
      }),
      this.fastify.prisma.adminSession.deleteMany({ where: { adminId } }),
      this.fastify.prisma.adminSession.create({
        data: {
          tokenHash: hashSessionToken(token),
          adminId,
          expiresAt: new Date(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000),
        },
      }),
    ]);

    return { token };
  }

  async logout(token: string | undefined) {
    if (!token) return;
    await this.fastify.prisma.adminSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
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

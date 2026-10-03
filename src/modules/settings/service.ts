import type { FastifyInstance } from 'fastify';
import type { UpdateSettingsInput } from './schema.js';

export class SettingsService {
  constructor(private fastify: FastifyInstance) {}

  async getSettings() {
    let settings = await (this.fastify as any).prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: {
        profileImage: true,
        hoverImage: true,
        aboutImage: true,
        cv: true
      }
    });

    if (!settings) {
      // Create defaults if it doesn't exist
      settings = await (this.fastify as any).prisma.siteSettings.create({
        data: { id: 1, ownerName: "Portfolio Owner", roles: ["Developer"] }
      });
    }
    
    return settings;
  }

  async updateSettings(data: UpdateSettingsInput) {
    return await (this.fastify as any).prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ownerName: data.ownerName || "Portfolio Owner",
        roles: data.roles || ["Developer"],
        ...data
      },
      include: {
        profileImage: true,
        hoverImage: true,
        aboutImage: true,
        cv: true
      }
    });
  }
}

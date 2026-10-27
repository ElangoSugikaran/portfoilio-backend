import type { FastifyInstance } from 'fastify';
import type { UpdateSettingsInput } from './schema.js';

/**
 * Service managing singleton SiteSettings (id = 1).
 */
export class SettingsService {
  constructor(private fastify: FastifyInstance) {}

  async getSettings() {
    let settings = await this.fastify.prisma.siteSettings.findUnique({
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
      settings = await this.fastify.prisma.siteSettings.create({
        data: { id: 1, ownerName: "Elango Sugikaran", roles: ["Full Stack Developer"] },
        include: {
          profileImage: true,
          hoverImage: true,
          aboutImage: true,
          cv: true
        }
      });
    }

    const socialLinks = await this.fastify.prisma.socialLink.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    return {
      ...settings,
      socialLinks
    };
  }

  async updateSettings(data: UpdateSettingsInput) {
    return await this.fastify.prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ownerName: data.ownerName || "Elango Sugikaran",
        roles: data.roles || ["Full Stack Developer"],
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

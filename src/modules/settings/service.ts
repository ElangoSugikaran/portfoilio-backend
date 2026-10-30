import type { FastifyInstance } from 'fastify';
import type { UpdateSettingsInput } from './schema.js';

const settingsSelection = {
  id: true,
  experienceFallbackText: true,
  seoTitle: true,
  seoDescription: true,
  showExperience: true,
  showCertificates: true,
  brandLogo: {
    select: {
      id: true,
      url: true,
      alt: true,
    },
  },
} as const;

/**
 * Service managing singleton SiteSettings (id = 1).
 */
export class SettingsService {
  constructor(private fastify: FastifyInstance) {}

  async getSettings() {
    const settings = await this.fastify.prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: settingsSelection,
    });

    if (!settings) {
      return {
        id: 1,
        experienceFallbackText: null,
        seoTitle: null,
        seoDescription: null,
        showExperience: true,
        showCertificates: true,
        brandLogo: null,
      };
    }

    return {
      ...settings,
      brandLogo: settings.brandLogo
        ? {
            id: settings.brandLogo.id,
            url: settings.brandLogo.url,
            fileName: settings.brandLogo.alt || undefined,
          }
        : null,
    };
  }

  async updateSettings(data: UpdateSettingsInput) {
    if (data.brandLogoId) {
      const logo = await this.fastify.prisma.media.findUnique({
        where: { id: data.brandLogoId },
        select: { type: true },
      });
      if (!logo || logo.type !== 'IMAGE') {
        throw new Error('The selected site logo must be an existing image.');
      }
    }

    await this.fastify.prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ownerName: "Elango Sugikaran",
        roles: ["Full Stack Developer"],
        ...data
      },
      select: settingsSelection,
    });

    return this.getSettings();
  }
}

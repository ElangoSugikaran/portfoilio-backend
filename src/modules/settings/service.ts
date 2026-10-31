import type { FastifyInstance } from 'fastify';
import type { UpdateSettingsInput } from './schema.js';
import { deleteMediaAsset } from '../../services/media-asset.service.js';

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

  async getPublicSettings() {
    const settings = await this.getSettings();

    return {
      brandLogo: settings.brandLogo ? { url: settings.brandLogo.url } : null,
      experienceFallbackText: settings.experienceFallbackText,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
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

    const existing = await this.fastify.prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { brandLogoId: true },
    });

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

    if (data.brandLogoId !== undefined && data.brandLogoId !== existing?.brandLogoId) {
      await deleteMediaAsset(this.fastify.prisma, existing?.brandLogoId, this.fastify.log);
    }

    return this.getSettings();
  }
}

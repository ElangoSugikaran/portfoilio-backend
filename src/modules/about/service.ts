import type { FastifyInstance } from 'fastify';
import type { UpdateAboutInput } from './schema.js';

export class AboutService {
  constructor(private fastify: FastifyInstance) {}

  async getAbout() {
    const prisma = this.fastify.prisma;

    let settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: {
        profileImage: true,
        introMedia: true,
      },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 1,
          ownerName: 'Elango Sugikaran',
          roles: ['Full Stack Developer'],
          aboutText: 'Passionate developer building scalable web solutions.',
          availableForWork: true,
        },
        include: {
          profileImage: true,
          introMedia: true,
        },
      });
    }

    const socialLinks = await prisma.socialLink.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const resumes = await prisma.resumeDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: settings.id.toString(),
      fullName: settings.ownerName || '',
      title: settings.roles?.[0] || 'Full Stack Developer',
      tagline: settings.heroIntro || '',
      bio: settings.aboutText || '',
      location: settings.address || '',
      email: settings.email || '',
      phone: settings.phone || '',
      availableForWork: (settings as any).availableForWork ?? true,
      avatar: settings.profileImage
        ? {
            id: settings.profileImage.id,
            url: settings.profileImage.url,
            fileName: settings.profileImage.alt || 'Avatar',
          }
        : null,
      introMedia: settings.introMedia
        ? {
            id: settings.introMedia.id,
            url: settings.introMedia.url,
            fileName: settings.introMedia.alt || 'Intro Media',
            type: settings.introMedia.type?.toLowerCase() === 'video' ? 'video' : 'image',
          }
        : null,
      socialLinks: socialLinks.map((s) => ({
        id: s.id,
        platform: s.platform,
        url: s.url,
        icon: (s as any).icon || 'Globe',
        active: s.isVisible,
      })),
      resumes: resumes.map((r) => ({
        id: r.id,
        title: r.title,
        fileId: r.fileId,
        fileUrl: r.fileUrl,
        fileName: r.fileName || undefined,
        fileSize: r.fileSize || undefined,
        isPrimary: r.isPrimary,
        uploadedAt: r.uploadedAt,
      })),
    };
  }

  async updateAbout(data: UpdateAboutInput) {
    const prisma = this.fastify.prisma;

    // 1. Upsert SiteSettings
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {
        ownerName: data.fullName,
        roles: [data.title],
        heroIntro: data.tagline || null,
        aboutText: data.bio,
        address: data.location || null,
        email: data.email,
        phone: data.phone || null,
        availableForWork: data.availableForWork ?? true,
        profileImageId: data.avatar?.id || null,
        introMediaId: data.introMedia?.id || null,
      },
      create: {
        id: 1,
        ownerName: data.fullName,
        roles: [data.title],
        heroIntro: data.tagline || null,
        aboutText: data.bio,
        address: data.location || null,
        email: data.email,
        phone: data.phone || null,
        availableForWork: data.availableForWork ?? true,
        profileImageId: data.avatar?.id || null,
        introMediaId: data.introMedia?.id || null,
      },
    });

    // 2. Synchronize Social Links
    await prisma.socialLink.deleteMany();
    if (data.socialLinks && data.socialLinks.length > 0) {
      await prisma.socialLink.createMany({
        data: data.socialLinks.map((s, idx) => ({
          platform: s.platform,
          url: s.url,
          icon: s.icon || 'Globe',
          isVisible: s.active ?? true,
          sortOrder: idx,
        })),
      });
    }

    // 3. Synchronize Resumes
    await prisma.resumeDocument.deleteMany();
    if (data.resumes && data.resumes.length > 0) {
      await prisma.resumeDocument.createMany({
        data: data.resumes.map((r) => ({
          title: r.title,
          fileId: r.fileId,
          fileUrl: r.fileUrl,
          fileName: r.fileName || null,
          fileSize: r.fileSize || null,
          isPrimary: r.isPrimary ?? false,
          uploadedAt: r.uploadedAt || new Date().toISOString(),
        })),
      });
    }

    return await this.getAbout();
  }
}

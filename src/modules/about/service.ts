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
        introMediaGallery: {
          orderBy: { settingsIntroGalleryOrder: 'asc' },
        },
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
          introMediaGallery: {
            orderBy: { settingsIntroGalleryOrder: 'asc' },
          },
        },
      });
    }

    const socialLinks = await prisma.socialLink.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const resumes = await prisma.resumeDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const titles = settings.roles?.filter((role) => role.trim()) || [];
    const professionalTitles = titles.length > 0 ? titles : ['Full Stack Developer'];

    return {
      id: settings.id.toString(),
      fullName: settings.ownerName || '',
      title: professionalTitles[0],
      titles: professionalTitles,
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
            type: settings.introMedia.type === 'VIDEO' ? 'video' : 'image',
          }
        : null,
      introMediaGallery: (settings.introMediaGallery.length
        ? settings.introMediaGallery
        : settings.introMedia
          ? [settings.introMedia]
          : []
      ).map((media) => ({
        id: media.id,
        url: media.url,
        fileName: media.alt || undefined,
        type: media.type === 'VIDEO' ? 'video' as const : 'image' as const,
      })),
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
    const galleryItems = data.introMediaGallery;
    const galleryIds = galleryItems?.map((media) => media.id) || [];
    const existingMedia = galleryIds.length
      ? await prisma.media.findMany({
          where: { id: { in: galleryIds } },
          select: { id: true, type: true },
        })
      : [];
    const existingMediaById = new Map(existingMedia.map((media) => [media.id, media]));

    if (new Set(galleryIds).size !== galleryIds.length) {
      throw new Error('The About Me media gallery contains duplicate media items.');
    }

    if (existingMedia.length !== galleryIds.length) {
      throw new Error('One or more About Me gallery items do not exist.');
    }

    if (existingMedia.some((media) => media.type === 'DOCUMENT')) {
      throw new Error('Only images and videos can be added to the About Me gallery.');
    }

    const introMedia = galleryItems !== undefined
      ? galleryItems.find((media) => existingMediaById.get(media.id)?.type === 'VIDEO') || galleryItems[0] || null
      : data.introMedia;
    const titles = data.titles?.length ? data.titles : [data.title];

    const settingsUpsert = {
      where: { id: 1 },
      update: {
        ownerName: data.fullName,
        roles: titles,
        heroIntro: data.tagline || null,
        aboutText: data.bio,
        address: data.location || null,
        email: data.email,
        phone: data.phone || null,
        availableForWork: data.availableForWork ?? true,
        profileImageId: data.avatar?.id || null,
        introMediaId: introMedia?.id || null,
      },
      create: {
        id: 1,
        ownerName: data.fullName,
        roles: titles,
        heroIntro: data.tagline || null,
        aboutText: data.bio,
        address: data.location || null,
        email: data.email,
        phone: data.phone || null,
        availableForWork: data.availableForWork ?? true,
        profileImageId: data.avatar?.id || null,
        introMediaId: introMedia?.id || null,
      },
    };

    // Keep the gallery relation and the hero's selected media in sync.
    await prisma.$transaction(async (transaction) => {
      await transaction.siteSettings.upsert(settingsUpsert);
      if (galleryItems !== undefined) {
        await transaction.media.updateMany({
          where: { settingsIntroGalleryId: 1 },
          data: { settingsIntroGalleryId: null, settingsIntroGalleryOrder: null },
        });

        for (const [sortOrder, media] of galleryItems.entries()) {
          await transaction.media.update({
            where: { id: media.id },
            data: { settingsIntroGalleryId: 1, settingsIntroGalleryOrder: sortOrder },
          });
        }
      }
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

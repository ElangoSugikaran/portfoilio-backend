import type { FastifyInstance } from 'fastify';
import type { UpdateAboutInput } from './schema.js';
import { AppError } from '../../lib/errors.js';
import { cloudinaryService, type CloudinaryResourceType } from '../../services/cloudinary.service.js';
import { deleteMediaAsset, deleteMediaAssets } from '../../services/media-asset.service.js';

export class AboutService {
  constructor(private fastify: FastifyInstance) {}

  private getCvFilename(cv: { fileName?: string | null; title?: string | null }): string {
    const baseName = (cv.fileName || cv.title || 'resume')
      .replace(/\.pdf$/i, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume';
    return `${baseName}.pdf`;
  }

  async getAbout(baseUrl?: string, publicView = false) {
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
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
    const titles = settings.roles?.filter((role) => role.trim()) || [];
    const professionalTitles = titles.length > 0 ? titles : ['Full Stack Developer'];
    const base = baseUrl?.replace(/\/+$/g, '') || '';
    const primaryResume = resumes.find((resume) => resume.isPrimary) || resumes[0];
    const gallery = (settings.introMediaGallery.length
      ? settings.introMediaGallery
      : settings.introMedia
        ? [settings.introMedia]
        : []
    ).map((media) => ({
      id: media.id,
      url: media.url,
      fileName: media.alt || undefined,
      type: media.type === 'VIDEO' ? 'video' as const : 'image' as const,
    }));

    if (publicView) {
      return {
        fullName: settings.ownerName || '',
        title: professionalTitles[0],
        titles: professionalTitles,
        tagline: settings.heroIntro || '',
        bio: settings.aboutText || '',
        location: settings.address || '',
        email: settings.email || '',
        phone: settings.phone || '',
        availableForWork: (settings as any).availableForWork ?? true,
        avatar: settings.profileImage ? { url: settings.profileImage.url } : null,
        introMedia: settings.introMedia
          ? {
              url: settings.introMedia.url,
              type: settings.introMedia.type === 'VIDEO' ? 'video' : 'image',
            }
          : null,
        socialLinks: socialLinks
          .filter((social) => social.isVisible)
          .map((social) => ({
            platform: social.platform,
            url: social.url,
          })),
        resumes: primaryResume
          ? [
              {
                downloadUrl: `${base}/api/v1/about/cv/download/${primaryResume.id}`,
                isPrimary: true,
              },
            ]
          : [],
      };
    }

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
      introMediaGallery: gallery,
      socialLinks: socialLinks.map((s) => ({
        id: s.id,
        platform: s.platform,
        url: s.url,
        icon: (s as any).icon || 'Globe',
        active: s.isVisible,
      })),
      resumes: resumes.map((r) => {
        const downloadUrl = `${base}/api/v1/about/cv/download/${r.id}`;
        return {
          id: r.id,
          title: r.title,
          fileId: r.fileId,
          fileUrl: downloadUrl,
          downloadUrl,
          viewUrl: `${downloadUrl}?inline=true`,
          publicId: r.publicId || undefined,
          resourceType: r.resourceType || 'raw',
          mimeType: r.mimeType || 'application/pdf',
          fileName: r.fileName || undefined,
          fileSize: r.fileSize || undefined,
          sizeBytes: r.sizeBytes || undefined,
          isPrimary: r.isPrimary,
          uploadedAt: r.uploadedAt,
        };
      }),
    };
  }

  async getCvFile(id: string) {
    const prisma = this.fastify.prisma;
    const cv = await prisma.resumeDocument.findUnique({
      where: { id },
    });

    if (!cv) {
      throw AppError.notFound('CV document not found');
    }

    try {
      const buffer = await cloudinaryService.fetchAssetBuffer(
        cv.publicId || cv.fileId,
        (cv.resourceType as CloudinaryResourceType) || 'raw',
        cv.fileUrl,
      );

      return {
        buffer,
        filename: this.getCvFilename(cv),
        cv,
      };
    } catch (error: any) {
      throw AppError.internal(error?.message || 'Could not retrieve the CV file.');
    }
  }

  private async syncResumes(data: UpdateAboutInput) {
    const prisma = this.fastify.prisma;
    const incoming = data.resumes;
    if (incoming === undefined) return;

    const existing = await prisma.resumeDocument.findMany();
    const existingById = new Map(existing.map((cv) => [cv.id, cv]));
    const incomingIds = new Set(incoming.map((cv) => cv.id).filter((id): id is string => Boolean(id)));

    const removed = existing.filter((cv) => !incomingIds.has(cv.id));
    for (const cv of removed) {
      await prisma.resumeDocument.delete({ where: { id: cv.id } });
      if (cv.publicId) {
        await cloudinaryService.destroyAsset(
          cv.publicId,
          (cv.resourceType as CloudinaryResourceType) || 'raw',
          this.fastify.log,
        );
      } else if (cv.fileId) {
        // Legacy CVs stored the Media row id in fileId.
        await deleteMediaAsset(prisma, cv.fileId, this.fastify.log);
      }
    }

    for (const [index, cv] of incoming.entries()) {
      const current = cv.id ? existingById.get(cv.id) : undefined;

      if (current) {
        await prisma.resumeDocument.update({
          where: { id: current.id },
          data: {
            title: cv.title,
            isPrimary: index === 0 ? true : cv.isPrimary ?? false,
          },
        });
        continue;
      }

      const media = cv.fileId
        ? await prisma.media.findUnique({ where: { id: cv.fileId } }).catch(() => null)
        : null;

      await prisma.resumeDocument.create({
        data: {
          title: cv.title,
          fileId: cv.fileId,
          fileUrl: cv.fileUrl,
          publicId: cv.publicId || media?.publicId || null,
          resourceType: cv.resourceType || media?.resourceType || 'raw',
          mimeType: cv.mimeType || 'application/pdf',
          fileName: cv.fileName || media?.alt || null,
          fileSize: cv.fileSize || (media?.sizeBytes ? `${Math.round(media.sizeBytes / 1024)} KB` : null),
          sizeBytes: cv.sizeBytes || media?.sizeBytes || null,
          isPrimary: index === 0 ? true : cv.isPrimary ?? false,
          uploadedAt: cv.uploadedAt || new Date().toISOString(),
        },
      });
    }

    const all = await prisma.resumeDocument.findMany({ orderBy: { createdAt: 'desc' } });
    const primary = all.find((cv) => cv.isPrimary) || all[0];
    if (primary) {
      await prisma.resumeDocument.updateMany({ data: { isPrimary: false } });
      await prisma.resumeDocument.update({ where: { id: primary.id }, data: { isPrimary: true } });
    }
  }

  async updateAbout(data: UpdateAboutInput, baseUrl?: string) {
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

    const existingSettings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { profileImageId: true, introMediaId: true },
    });
    const oldGalleryIds = galleryItems !== undefined
      ? (await prisma.media.findMany({
          where: { settingsIntroGalleryId: 1 },
          select: { id: true },
        })).map((media) => media.id)
      : [];

    const introMedia = galleryItems !== undefined
      ? galleryItems.find((media) => existingMediaById.get(media.id)?.type === 'VIDEO') || galleryItems[0] || null
      : data.introMedia;
    const titles = data.titles?.length ? data.titles : [data.title];
    const profileImageId = data.avatar !== undefined
      ? data.avatar?.id || null
      : existingSettings?.profileImageId || null;
    const introMediaId = galleryItems !== undefined
      ? introMedia?.id || null
      : data.introMedia !== undefined
        ? data.introMedia?.id || null
        : existingSettings?.introMediaId || null;

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
        profileImageId,
        introMediaId,
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
        profileImageId,
        introMediaId,
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

    if (galleryItems !== undefined) {
      const keptGalleryIds = new Set(galleryIds);
      await deleteMediaAssets(
        prisma,
        oldGalleryIds.filter((mediaId) => !keptGalleryIds.has(mediaId)),
        this.fastify.log,
      );
    }

    if (data.avatar !== undefined && profileImageId !== existingSettings?.profileImageId) {
      await deleteMediaAsset(prisma, existingSettings?.profileImageId, this.fastify.log);
    }

    if (introMediaId !== existingSettings?.introMediaId) {
      await deleteMediaAsset(prisma, existingSettings?.introMediaId, this.fastify.log);
    }

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

    // 3. Synchronize Resumes only when a legacy client explicitly sends them.
    // The admin dashboard now manages CVs through /api/v1/admin/cvs.
    await this.syncResumes(data);

    return await this.getAbout(baseUrl);
  }
}

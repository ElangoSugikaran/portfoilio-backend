import type { PrismaClient } from '../generated/prisma/client.js';
import { cloudinaryService, type CloudinaryLogger, type CloudinaryResourceType } from './cloudinary.service.js';

/**
 * Deletes a Media row and its Cloudinary asset only when nothing references it.
 * Call this after the owning record has been deleted/detached so orphaned
 * assets are removed without breaking another section that still uses them.
 */
export async function deleteMediaAsset(
  prisma: PrismaClient,
  mediaId: string | null | undefined,
  logger?: CloudinaryLogger,
): Promise<boolean> {
  if (!mediaId) return false;

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return false;

  const [projectThumbnail, projectMedia, certificate, siteSettings, admin] = await Promise.all([
    prisma.project.count({ where: { thumbnailId: mediaId } }),
    prisma.projectMedia.count({ where: { mediaId } }),
    prisma.certificate.count({ where: { imageId: mediaId } }),
    prisma.siteSettings.count({
      where: {
        OR: [
          { profileImageId: mediaId },
          { hoverImageId: mediaId },
          { aboutImageId: mediaId },
          { introMediaId: mediaId },
          { brandLogoId: mediaId },
          { cvId: mediaId },
        ],
      },
    }),
    prisma.admin.count({ where: { profileImageId: mediaId } }),
  ]);

  if (projectThumbnail + projectMedia + certificate + siteSettings + admin > 0) {
    return false;
  }

  await prisma.media.delete({ where: { id: mediaId } });

  if (media.provider === 'CLOUDINARY' && media.publicId) {
    await cloudinaryService.destroyAsset(
      media.publicId,
      (media.resourceType as CloudinaryResourceType) || 'image',
      logger,
    );
  }

  return true;
}

export async function deleteMediaAssets(
  prisma: PrismaClient,
  mediaIds: Array<string | null | undefined>,
  logger?: CloudinaryLogger,
): Promise<void> {
  const uniqueIds = [...new Set(mediaIds.filter((id): id is string => Boolean(id)))];
  for (const mediaId of uniqueIds) {
    await deleteMediaAsset(prisma, mediaId, logger);
  }
}

import type { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../lib/cloudinary.js';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface CloudinaryLogger {
  error: (...args: any[]) => void;
  warn?: (...args: any[]) => void;
}

export interface UploadAssetOptions {
  buffer: Buffer;
  resourceType: CloudinaryResourceType;
  folder?: string;
  publicId?: string;
}

export function getFileExtension(fileName: string): string {
  const match = fileName.trim().match(/\.[a-zA-Z0-9]{1,10}$/);
  return match ? match[0].toLowerCase() : '';
}

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() || 'file';
  const withoutExtension = baseName.replace(/\.[^.]+$/, '');
  return (
    withoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file'
  );
}

export function buildPublicId(folder: string, originalFileName: string, extension?: string): string {
  const safeName = sanitizeFileName(originalFileName);
  const ext = extension ?? getFileExtension(originalFileName);
  const timestamp = Date.now();
  return `${folder.replace(/\/+$/g, '')}/${safeName}-${timestamp}${ext}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const cloudinaryService = {
  /**
   * Account-level security can block public delivery of PDF/ZIP assets with
   * `401 deny or ACL failure`. The signed Admin API download endpoint still
   * serves the file, so the backend proxies CV bytes instead of exposing the
   * Cloudinary URL to browsers.
   */
  createSignedDownloadUrl(
    publicId: string,
    resourceType: CloudinaryResourceType = 'raw',
    format = 'pdf',
  ): string {
    return cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'upload',
    });
  },

  async fetchAssetBuffer(
    publicId: string | null | undefined,
    resourceType: CloudinaryResourceType = 'raw',
    fallbackUrl?: string | null,
  ): Promise<Buffer> {
    const candidates = [
      publicId ? this.createSignedDownloadUrl(publicId, resourceType) : null,
      fallbackUrl || null,
    ].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);

    let lastStatus: number | null = null;
    for (const url of candidates) {
      const response = await fetch(url);
      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
      lastStatus = response.status;
    }

    throw new Error(
      lastStatus
        ? `Cloudinary could not deliver the file (HTTP ${lastStatus}).`
        : 'No downloadable Cloudinary asset is available.',
    );
  },

  uploadBuffer(options: UploadAssetOptions): Promise<UploadApiResponse> {
    const { buffer, resourceType, folder, publicId } = options;

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          ...(publicId ? { public_id: publicId } : folder ? { folder } : {}),
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  },

  async destroyAsset(
    publicId: string | null | undefined,
    resourceType: CloudinaryResourceType = 'image',
    logger?: CloudinaryLogger,
  ): Promise<boolean> {
    if (!publicId) return false;

    try {
      const result: any = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (result?.result !== 'ok' && result?.result !== 'not found') {
        logger?.warn?.({ publicId, resourceType, result }, 'Cloudinary asset was not deleted');
        return false;
      }
      return result?.result === 'ok';
    } catch (error) {
      logger?.error({ err: error, publicId, resourceType }, 'Failed to delete Cloudinary asset');
      return false;
    }
  },
};

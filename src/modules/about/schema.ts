import { z } from 'zod';

export const socialLinkInputSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, 'Platform name is required'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string().default('Globe'),
  active: z.boolean().default(true),
});

export const resumeDocumentInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  fileId: z.string().min(1, 'File ID is required'),
  fileUrl: z.string().url('Must be a valid URL'),
  publicId: z.string().optional().nullable(),
  resourceType: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.string().optional().nullable(),
  sizeBytes: z.number().int().optional().nullable(),
  isPrimary: z.boolean().default(false),
  uploadedAt: z.string().optional(),
});

export const mediaGalleryItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  fileName: z.string().optional().nullable(),
  type: z.enum(['image', 'video', 'document']).optional(),
});

export const mediaItemSchema = mediaGalleryItemSchema.nullable().optional();

export const updateAboutSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  title: z.string().min(1, 'Professional title is required'),
  titles: z.array(z.string().trim().min(1, 'Professional titles cannot be empty')).optional(),
  tagline: z.string().optional().nullable(),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  location: z.string().optional().nullable(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  availableForWork: z.boolean().default(true),
  avatar: mediaItemSchema,
  introMedia: mediaItemSchema,
  introMediaGallery: z.array(mediaGalleryItemSchema).optional(),
  socialLinks: z.array(socialLinkInputSchema).default([]),
  resumes: z.array(resumeDocumentInputSchema).optional(),
});

export type UpdateAboutInput = z.infer<typeof updateAboutSchema>;

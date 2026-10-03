import { z } from 'zod';

export const updateSettingsSchema = z.object({
  ownerName: z.string().min(1, "Owner name is required"),
  roles: z.array(z.string()).default([]),
  heroIntro: z.string().optional().nullable(),
  aboutText: z.string().optional().nullable(),
  experienceFallbackText: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  showExperience: z.boolean().default(true),
  showCertificates: z.boolean().default(true),
  
  profileImageId: z.string().optional().nullable(),
  hoverImageId: z.string().optional().nullable(),
  aboutImageId: z.string().optional().nullable(),
  cvId: z.string().optional().nullable(),
}).partial();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

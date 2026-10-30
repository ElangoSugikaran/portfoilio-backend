import { z } from 'zod';

export const updateSettingsSchema = z.object({
  experienceFallbackText: z.string().optional().nullable(),
  brandLogoId: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  showExperience: z.boolean().default(true),
  showCertificates: z.boolean().default(true),
}).partial();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

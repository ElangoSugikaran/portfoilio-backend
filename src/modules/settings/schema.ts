import { z } from 'zod';

export const updateSettingsSchema = z.object({
  experienceFallbackText: z.string().optional().nullable(),
  brandLogoId: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  showExperience: z.boolean().optional(),
  showCertificates: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

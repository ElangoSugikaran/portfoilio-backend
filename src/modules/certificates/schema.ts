import { z } from 'zod';

const certificateCategoryEnum = z.enum(['ACADEMIC', 'DIGITAL']);

export const createCertificateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  issuer: z.string().optional().default(""),
  category: certificateCategoryEnum.default("ACADEMIC"),
  issuedAt: z.coerce.date().optional().nullable(),
  credentialUrl: z
    .union([
      z.string().url("Must be a valid URL"),
      z.literal(""),
      z.null(),
      z.undefined()
    ])
    .optional()
    .nullable()
    .transform((val) => (!val || (typeof val === 'string' && val.trim() === '') ? null : val)),
  imageId: z.string().min(1, "Image ID is required"),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const updateCertificateSchema = createCertificateSchema.partial();
export const certificateParamSchema = z.object({ id: z.string() });

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;

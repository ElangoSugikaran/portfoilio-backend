import { z } from 'zod';

export const createExperienceSchema = z.object({
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const updateExperienceSchema = createExperienceSchema.partial();
export const experienceParamSchema = z.object({ id: z.string() });

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

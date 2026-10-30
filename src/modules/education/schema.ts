import { z } from 'zod';

const booleanQueryParam = z.enum(['true', 'false']).transform((value) => value === 'true');

export const educationListQuerySchema = z.object({
  all: booleanQueryParam.optional(),
  isVisible: booleanQueryParam.optional(),
  showOnHome: booleanQueryParam.optional(),
  home: booleanQueryParam.optional(),
});

export const createEducationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  institution: z.string().min(1, "Institution is required"),
  type: z.enum(["DEGREE", "DIPLOMA", "CERTIFICATE", "TRAINING", "SCHOOL"]),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  showOnHome: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const updateEducationSchema = createEducationSchema.partial();
export const educationParamSchema = z.object({ id: z.string() });

export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;

export const reorderEducationSchema = z.object({
  orders: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int()
  }))
});

export type ReorderEducationInput = z.infer<typeof reorderEducationSchema>;
export type EducationListQuery = z.infer<typeof educationListQuerySchema>;

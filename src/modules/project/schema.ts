import { z } from 'zod';

export const publishStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

export const createProjectSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  description: z.string().min(1, "Description is required"),
  status: publishStatusEnum.default('DRAFT'),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  
  githubUrl: z.string().url("Must be a valid URL").optional().nullable(),
  liveUrl: z.string().url("Must be a valid URL").optional().nullable(),
  
  methodology: z.string().optional().nullable(),
  aim: z.string().optional().nullable(),
  objectives: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  skillsDemonstrated: z.array(z.string()).default([]),
  
  startedAt: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  
  categoryId: z.string().optional().nullable(),
  thumbnailId: z.string().optional().nullable(),

  technologyIds: z.array(z.string()).default([])
});

export const updateProjectSchema = createProjectSchema.partial();
export const projectParamSchema = z.object({ id: z.string() });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

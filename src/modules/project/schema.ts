import { z } from 'zod';

export const publishStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

const booleanQueryParam = z.enum(['true', 'false']).transform((value) => value === 'true');

export const projectListQuerySchema = z.object({
  status: publishStatusEnum.optional(),
  featured: booleanQueryParam.optional(),
  feature: booleanQueryParam.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  category: z.string().min(1).optional(),
});

export const projectPhaseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Phase name is required'),
  tasks: z.array(z.string()).default([]),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  sortOrder: z.number().int().default(0)
});

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

  technologyIds: z.array(z.string()).default([]),
  
  phases: z.array(projectPhaseSchema).default([]),
  projectMedia: z.array(
    z.object({
      mediaId: z.string(),
      role: z.enum(['SCREENSHOT', 'DIAGRAM', 'DEMO']),
      group: z.string().optional().nullable(),
      caption: z.string().optional().nullable(),
      sortOrder: z.number().int().default(0)
    })
  ).default([])
});

export const updateProjectSchema = createProjectSchema.partial();
export const projectParamSchema = z.object({ id: z.string() });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;

import { z } from 'zod';

const techCategoryEnum = z.enum([
  'FRONTEND', 
  'BACKEND', 
  'FRAMEWORK', 
  'DATABASE', 
  'CSS_FRAMEWORK', 
  'DESIGN_TOOL', 
  'SERVICE', 
  'TOOL'
]);

export const createSkillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: techCategoryEnum,
  icon: z.string().optional().nullable(),
  showInSkills: z.boolean().default(false),
  sortOrder: z.number().int().default(0)
});

export const updateSkillSchema = createSkillSchema.partial();
export const skillParamSchema = z.object({ id: z.string() });

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

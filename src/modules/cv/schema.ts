import { z } from 'zod';

export const cvParamSchema = z.object({
  id: z.string().cuid('Invalid CV document ID'),
});

export type CvParams = z.infer<typeof cvParamSchema>;

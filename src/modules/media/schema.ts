import { z } from 'zod';
import { MediaType, MediaProvider } from '../../generated/prisma/client.js';

// Validation for delete parameter
export const deleteMediaParamsSchema = z.object({
  id: z.string().cuid(),
});

export type DeleteMediaParams = z.infer<typeof deleteMediaParamsSchema>;

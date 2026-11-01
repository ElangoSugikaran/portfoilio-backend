import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1, "Password is required").max(128)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds bcrypt’s 72-byte input limit.'),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z.string().min(12, "New password must be at least 12 characters").max(128)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be no more than 72 UTF-8 bytes when using bcrypt.'),
}).strict();

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const updateProfileSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format").max(254).optional(),
  name: z.string().max(100).nullable().optional(),
  profileImageId: z.string().max(64).nullable().optional()
}).strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

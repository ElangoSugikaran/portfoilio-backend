import 'dotenv/config';
import { z } from 'zod';

// Define the schema for your environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  PORT: z.string().default("8000").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGINS: z.string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.string().url()).min(1, 'CORS_ORIGINS must contain at least one valid origin'))
    .transform((origins) => origins.map((origin) => new URL(origin).origin)),
  ADMIN_ORIGINS: z.string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.string().url()).min(1, 'ADMIN_ORIGINS must contain at least one valid origin'))
    .transform((origins) => origins.map((origin) => new URL(origin).origin)),
  CLOUDINARY_URL: z.string().url("CLOUDINARY_URL must be a valid URL starting with cloudinary://"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  CONTACT_EMAIL_TO: z.string().email("CONTACT_EMAIL_TO must be a valid email"),
  GA4_PROPERTY_ID: z.string().regex(/^\d+$/, "GA4_PROPERTY_ID must be a numeric property ID").optional(),
  GA4_CLIENT_EMAIL: z.string().email("GA4_CLIENT_EMAIL must be a service account email").optional(),
  GA4_PRIVATE_KEY: z.string().min(1, "GA4_PRIVATE_KEY cannot be empty").optional()
    .transform((key) => key?.replace(/\\n/g, '\n')),
}).superRefine((values, context) => {
  if (values.NODE_ENV === 'production' && !process.env.CORS_ORIGINS?.trim()) {
    context.addIssue({
      code: 'custom',
      path: ['CORS_ORIGINS'],
      message: 'CORS_ORIGINS must be explicitly configured in production.',
    });
  }

  if (values.NODE_ENV === 'production' && !process.env.ADMIN_ORIGINS?.trim()) {
    context.addIssue({
      code: 'custom',
      path: ['ADMIN_ORIGINS'],
      message: 'ADMIN_ORIGINS must be explicitly configured in production.',
    });
  }

  const corsOrigins = new Set(values.CORS_ORIGINS);
  for (const origin of values.ADMIN_ORIGINS) {
    if (!corsOrigins.has(origin)) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_ORIGINS'],
        message: `Admin origin ${origin} must also be included in CORS_ORIGINS.`,
      });
    }
  }

  const analyticsCredentials = [values.GA4_PROPERTY_ID, values.GA4_CLIENT_EMAIL, values.GA4_PRIVATE_KEY];
  const configuredCount = analyticsCredentials.filter(Boolean).length;
  if (configuredCount > 0 && configuredCount < analyticsCredentials.length) {
    context.addIssue({
      code: 'custom',
      path: ['GA4_PROPERTY_ID'],
      message: 'Set GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, and GA4_PRIVATE_KEY together, or leave all three unset.',
    });
  }
});

// Validate the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

// Export the parsed, strictly-typed environment variables
export const env = parsedEnv.data;

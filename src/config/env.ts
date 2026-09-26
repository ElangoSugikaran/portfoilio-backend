import 'dotenv/config';
import { z } from 'zod';

// Define the schema for your environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  PORT: z.string().default("8000").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Add other environment variables here as needed, e.g.:
  // JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
});

// Validate the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

// Export the parsed, strictly-typed environment variables
export const env = parsedEnv.data;

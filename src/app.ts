import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import prismaPlugin from "./plugins/prisma.js";

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // Add Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register security plugins
  await app.register(helmet);
  await app.register(cors, { origin: "*" });

  // 🔌 Register the Database Connection
  await app.register(prismaPlugin);

  // Basic health-check route
  app.get("/health", async () => {
    return { status: "ok", message: "Server and DB are healthy!" };
  });

  return app;
}

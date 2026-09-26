# Project Dependencies Guide

This document tracks all the packages installed in our `package.json` and explains exactly why they are there and what they do.

## Production Dependencies (`dependencies`)

These are required for the application to run in production.

### Core Framework & Routing
- **`fastify`**: Our core high-performance web framework. Chosen for its speed and plugin ecosystem.
- **`fastify-type-provider-zod`**: A bridge that connects Fastify with Zod. It allows Fastify to automatically understand Zod schemas for route validation and provides full TypeScript inference for request bodies, queries, and responses.
- **`zod`**: A TypeScript-first schema declaration and validation library. We use it for environment variable validation (`env.ts`) and API route validation.

### Database & ORM (Prisma 7 Setup)
- **`@prisma/client`**: The auto-generated database client that gives us fully type-safe queries.
- **`@prisma/adapter-pg`**: Prisma 7's required driver adapter for PostgreSQL. It bridges the gap between Prisma and the native Node.js `pg` driver, allowing for edge-compatibility and better connection management.
- **`pg`**: The underlying, native Node.js PostgreSQL driver that physically connects to the Neon database.

### Security & Middlewares
- **`@fastify/cors`**: Handles Cross-Origin Resource Sharing. Allows frontend applications to securely make API requests to this backend.
- **`@fastify/helmet`**: Automatically sets important HTTP security headers to protect against common web vulnerabilities.
- **`@fastify/rate-limit`**: Protects the API from brute-force attacks and DDoS by limiting how many requests a user can make in a given timeframe.

### Environment & Utilities
- **`dotenv`**: Loads environment variables from our `.env` file into `process.env`. (We load this once in `src/config/env.ts`).

---

## Development Dependencies (`devDependencies`)

These are only used while writing and testing the code. They are stripped out in production.

### Build & Execution Tools
- **`typescript`**: The TypeScript compiler itself.
- **`tsx`**: A fast, modern TypeScript execution environment. We use this in our `npm run dev` script to run the server with instant hot-reloading, without needing to compile it to JavaScript first.

### Database Tooling
- **`prisma`**: The Prisma Command Line Interface (CLI). Used for commands like `npx prisma generate` (to build the client) and `npx prisma migrate` (to push schema changes to Neon).

### Type Definitions
- **`@types/node`**: Tells TypeScript about native Node.js globals (like `process.env` and `process.exit`).
- **`@types/pg`**: Tells TypeScript about the types and methods available in the `pg` driver.

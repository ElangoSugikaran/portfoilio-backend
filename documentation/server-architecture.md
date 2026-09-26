# Server Architecture

This document explains how our Fastify server is structured and why the logic is split across multiple files. This architecture is designed for scalability, testability, and safety.

## 1. `src/plugins/prisma.ts` (Database Layer)
We register Prisma as a Fastify Plugin rather than a globally exported constant.
- **Why?**: By attaching the database connection to the Fastify instance (`server.prisma`), the database connection lifecycle is tied to the server lifecycle. When the server starts, it connects. If the server shuts down gracefully, it automatically triggers `server.addHook('onClose')` to disconnect from the database, preventing connection leaks.
- **The Adapter**: We use `@prisma/adapter-pg` combined with the native `pg` pool to connect to our Neon serverless database.

## 2. `src/app.ts` (Application Factory)
This is the "Brain" of the backend. It contains the `buildApp()` function.
- **What it does**: It instantiates Fastify, sets the Zod type providers, and registers all plugins (CORS, Helmet, Prisma).
- **Why it does NOT start the server**: Notice there is no `.listen()` call here. This is crucial for automated testing. In our tests, we can call `buildApp()` to generate a mock version of the server, inject fake requests into it, and test our routes without ever actually opening a real HTTP port.

## 3. `src/server.ts` (Execution Entry Point)
This is the actual script that gets executed by Node (or `tsx` in development).
- **What it does**: It imports `buildApp()`, awaits its construction, and then calls `app.listen({ port: 8000 })`.
- **Environment**: It relies completely on the validated `env` object from `src/config/env.ts` to know which port to listen on.

## Summary Workflow
1. `npm run dev` runs `src/server.ts`.
2. `server.ts` asks `app.ts` to build the app.
3. `app.ts` loads the Prisma plugin, sets up security, and returns the app.
4. `server.ts` turns the app on and starts listening for HTTP requests on `localhost:8000`.

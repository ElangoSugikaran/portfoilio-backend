# Configuration Architecture & Decisions

This document explains the technical reasoning behind our project's configuration, specifically regarding environment variables and TypeScript module resolution.

## 1. Environment Variable Architecture (`env.ts`)

Instead of calling `process.env.VARIABLE_NAME` directly throughout the application, we use a "Single Source of Truth" pattern in `src/config/env.ts`.

### Why we do this:
1. **Validation at Startup**: By using Zod, we validate all required variables (like `DATABASE_URL` and `PORT`) the moment the app starts. If a variable is missing or formatted incorrectly, the app crashes immediately with a clear error, rather than silently failing later in production.
2. **Type Safety**: TypeScript normally treats `process.env` properties as `string | undefined`. By parsing it through Zod, we export a strongly-typed `env` object where `PORT` is guaranteed to be a `number`, and `NODE_ENV` is strictly `"development" | "production" | "test"`.
3. **No Repetition**: The `.env` file is loaded exactly once. Both our application code and `prisma.config.ts` import the single validated `env` object.

## 2. TypeScript and Node.js ES Modules (ESM)

This project is configured to use modern ECMAScript Modules (ESM) rather than legacy CommonJS. This required several specific configurations to work harmoniously across Node.js, Fastify, and TypeScript.

### Key Configurations:
- **`package.json`**: `"type": "module"` is set. This tells Node.js that `.js` files (which TypeScript compiles to) should be executed as ES Modules, allowing the use of modern `import`/`export` syntax.
- **`tsconfig.json`**: 
  - `"module": "nodenext"` and `"moduleResolution": "nodenext"` strictly enforces Node.js's ESM rules during TypeScript compilation.
  - `"types": ["node"]` ensures that global Node types (like `process`) are injected into the TypeScript environment.
  - `"include": ["src/**/*"]` prevents TypeScript from trying to compile root-level config files (like `prisma.config.ts`) against the strict `src/` root directory rules.

### The `.js` Import Quirk
In `prisma.config.ts` and other files, you will see imports like this:
```typescript
import { env } from "./src/config/env.js";
```
Even though the source file is `env.ts`, the import path explicitly ends in `.js`. 
**Why?** Because TypeScript intentionally does not rewrite import paths during compilation. Since native Node.js ESM requires exact file extensions to find the compiled files, the import must match the *compiled* output extension (`.js`), not the source extension (`.ts`). TypeScript is smart enough to understand this and will still type-check against the local `.ts` file.

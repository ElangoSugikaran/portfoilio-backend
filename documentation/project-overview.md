# Project Overview & Architecture

## Product Requirements (PRD) Summary
This project is the backend for a full-stack portfolio application. It is designed to be highly robust, strictly typed, and scalable. 

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Fastify (High-performance web framework)
- **Database ORM**: Prisma ORM v7
- **Database Provider**: Neon (Serverless Postgres)
- **Type Validation**: Zod (with fastify-type-provider-zod)
- **Language**: TypeScript (Configured for modern ECMAScript Modules)

## Folder Structure
```text
portfolio-backend/
├── .env                 # Environment variables (Ignored in Git, contains secrets)
├── package.json         # Project dependencies (Set to "type": "module" for ESM)
├── tsconfig.json        # TypeScript configuration (Strict NodeNext setup)
├── prisma.config.ts     # Prisma v7 configuration (Loads DB URL via env.ts)
├── prisma/
│   └── schema.prisma    # Prisma database schema definition
├── documentation/       # Internal project documentation (Ignored in Git)
└── src/                 # Main application source code
    ├── config/          # Configuration hubs
    │   └── env.ts       # Centralized, Zod-validated environment variables
    ├── modules/         # Domain-specific feature modules
    ├── plugins/         # Fastify plugins (e.g., Prisma client wrapper)
    ├── lib/             # Shared utility functions
    ├── types/           # Global TypeScript type definitions
    ├── app.ts           # Fastify application factory/setup
    └── server.ts        # Entry point to start the server
```

-- ResumeDocument existed in the Prisma schema before its metadata migration,
-- but its original table-creation migration was missing from migration history.
-- IF NOT EXISTS keeps this repair safe for databases where the table was
-- already created outside the migration chain.
CREATE TABLE IF NOT EXISTS "ResumeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeDocument_pkey" PRIMARY KEY ("id")
);

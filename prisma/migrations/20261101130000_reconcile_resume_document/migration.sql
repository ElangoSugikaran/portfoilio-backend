-- The CV metadata migration is already recorded as applied in the configured
-- Neon database even though its base table is missing. Reconcile the live
-- schema forward without dropping or rewriting any existing CV data.
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

ALTER TABLE "ResumeDocument"
    ADD COLUMN IF NOT EXISTS "publicId" TEXT,
    ADD COLUMN IF NOT EXISTS "resourceType" TEXT DEFAULT 'raw',
    ADD COLUMN IF NOT EXISTS "mimeType" TEXT DEFAULT 'application/pdf',
    ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER,
    ADD COLUMN IF NOT EXISTS "fileHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ResumeDocument_fileHash_key"
    ON "ResumeDocument"("fileHash");
CREATE INDEX IF NOT EXISTS "ResumeDocument_isPrimary_idx"
    ON "ResumeDocument"("isPrimary");

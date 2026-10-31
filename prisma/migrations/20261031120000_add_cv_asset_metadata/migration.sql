ALTER TABLE "ResumeDocument"
ADD COLUMN "publicId" TEXT,
ADD COLUMN "resourceType" TEXT DEFAULT 'raw',
ADD COLUMN "mimeType" TEXT DEFAULT 'application/pdf',
ADD COLUMN "sizeBytes" INTEGER,
ADD COLUMN "fileHash" TEXT;

CREATE UNIQUE INDEX "ResumeDocument_fileHash_key"
ON "ResumeDocument"("fileHash");

CREATE INDEX "ResumeDocument_isPrimary_idx"
ON "ResumeDocument"("isPrimary");

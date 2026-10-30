ALTER TABLE "SiteSettings"
ADD COLUMN "brandLogoId" TEXT;

ALTER TABLE "SiteSettings"
ADD CONSTRAINT "SiteSettings_brandLogoId_fkey"
FOREIGN KEY ("brandLogoId") REFERENCES "Media"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

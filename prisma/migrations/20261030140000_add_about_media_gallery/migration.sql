ALTER TABLE "Media"
ADD COLUMN "settingsIntroGalleryId" INTEGER,
ADD COLUMN "settingsIntroGalleryOrder" INTEGER;

CREATE INDEX "Media_settingsIntroGalleryId_settingsIntroGalleryOrder_idx"
ON "Media"("settingsIntroGalleryId", "settingsIntroGalleryOrder");

ALTER TABLE "Media"
ADD CONSTRAINT "Media_settingsIntroGalleryId_fkey"
FOREIGN KEY ("settingsIntroGalleryId") REFERENCES "SiteSettings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

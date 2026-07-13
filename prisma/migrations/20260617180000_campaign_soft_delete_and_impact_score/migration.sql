ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "impact_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "emergencies_supported" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "donations"
ADD COLUMN IF NOT EXISTS "is_anonymous" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "campaigns"
ADD COLUMN IF NOT EXISTS "public_id" TEXT,
ADD COLUMN IF NOT EXISTS "deleted_by_id" UUID,
ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "approved_by_id" UUID,
ADD COLUMN IF NOT EXISTS "approval_notes" TEXT;

UPDATE "campaigns"
SET "public_id" = CONCAT(
  COALESCE(
    NULLIF(
      REGEXP_REPLACE(
        LOWER("title"),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      ''
    ),
    'campaign'
  ),
  '-',
  LEFT(REPLACE("id"::text, '-', ''), 8)
)
WHERE "public_id" IS NULL;

ALTER TABLE "campaigns"
ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_public_id_key" ON "campaigns"("public_id");

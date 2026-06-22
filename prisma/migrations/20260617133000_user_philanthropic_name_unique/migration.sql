-- Add philanthropic name column (required + unique)
ALTER TABLE "users" ADD COLUMN "philanthropic_name" TEXT;

UPDATE "users"
SET "philanthropic_name" = CONCAT(TRIM("first_name" || ' ' || "last_name"), '-', SUBSTRING("id"::text, 1, 6))
WHERE "philanthropic_name" IS NULL OR "philanthropic_name" = '';

ALTER TABLE "users" ALTER COLUMN "philanthropic_name" SET NOT NULL;

CREATE UNIQUE INDEX "users_philanthropic_name_key" ON "users"("philanthropic_name");


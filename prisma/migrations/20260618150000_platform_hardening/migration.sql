ALTER TABLE "campaigns"
ADD COLUMN "hospital_name" TEXT,
ADD COLUMN "hospital_contact" TEXT;

CREATE TYPE "DOCUMENT_REQUEST_STATUS" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "supporting_document_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "status" "DOCUMENT_REQUEST_STATUS" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "supporting_document_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaign_extension_audits" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "old_deadline" TIMESTAMP(3) NOT NULL,
    "new_deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_extension_audits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supporting_document_requests_user_id_campaign_id_key"
ON "supporting_document_requests"("user_id", "campaign_id");

CREATE INDEX "supporting_document_requests_campaign_id_status_idx"
ON "supporting_document_requests"("campaign_id", "status");

CREATE INDEX "campaign_extension_audits_campaign_id_created_at_idx"
ON "campaign_extension_audits"("campaign_id", "created_at");

ALTER TABLE "supporting_document_requests"
ADD CONSTRAINT "supporting_document_requests_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supporting_document_requests"
ADD CONSTRAINT "supporting_document_requests_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supporting_document_requests"
ADD CONSTRAINT "supporting_document_requests_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_extension_audits"
ADD CONSTRAINT "campaign_extension_audits_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_extension_audits"
ADD CONSTRAINT "campaign_extension_audits_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

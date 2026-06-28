ALTER TABLE "users"
ADD COLUMN "marketing_metadata" JSONB,
ADD COLUMN "last_marketing_sync_at" TIMESTAMP(3);

ALTER TABLE "donations"
ADD COLUMN "donor_email" TEXT;

CREATE INDEX "donations_campaign_id_status_idx" ON "donations"("campaign_id", "status");
CREATE INDEX "donations_user_id_status_idx" ON "donations"("user_id", "status");

ALTER TABLE "campaigns"
ADD COLUMN "approval_email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approved_at" TIMESTAMP(3);

ALTER TABLE "payments"
ADD COLUMN "donor_email" TEXT,
ADD COLUMN "payment_channel" TEXT,
ADD COLUMN "paystack_transaction_id" BIGINT,
ADD COLUMN "verified_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "payments_tx_ref_key" ON "payments"("tx_ref");
CREATE INDEX "payments_donation_id_idx" ON "payments"("donation_id");
CREATE INDEX "payments_user_id_status_idx" ON "payments"("user_id", "status");
CREATE INDEX "payments_provider_status_idx" ON "payments"("provider", "status");

ALTER TABLE "webhooks"
ADD COLUMN "event_type" TEXT,
ADD COLUMN "reference" TEXT,
ADD COLUMN "paystack_event_id" TEXT;

CREATE UNIQUE INDEX "webhooks_paystack_event_id_key" ON "webhooks"("paystack_event_id");
CREATE INDEX "webhooks_reference_idx" ON "webhooks"("reference");

-- Harden manual payment submissions for production review workflows.
ALTER TABLE "PaymentSubmission"
  ADD COLUMN IF NOT EXISTS "senderAccountNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
  ADD COLUMN IF NOT EXISTS "proofHash" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentSubmission_paymentReference_key"
  ON "PaymentSubmission"("paymentReference");

CREATE INDEX IF NOT EXISTS "PaymentSubmission_planId_idx"
  ON "PaymentSubmission"("planId");

CREATE INDEX IF NOT EXISTS "PaymentSubmission_paymentReference_idx"
  ON "PaymentSubmission"("paymentReference");

CREATE INDEX IF NOT EXISTS "PaymentSubmission_proofHash_idx"
  ON "PaymentSubmission"("proofHash");

CREATE INDEX IF NOT EXISTS "PaymentSubmission_createdAt_idx"
  ON "PaymentSubmission"("createdAt");

CREATE INDEX IF NOT EXISTS "PaymentSubmission_deletedAt_idx"
  ON "PaymentSubmission"("deletedAt");

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_entityId_fkey";
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_entityId_fkey"
  FOREIGN KEY ("entityId") REFERENCES "PaymentSubmission"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

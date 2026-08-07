-- P0-3: Add composite index on proofHash+status for efficient global cross-org duplicate proof checking.
CREATE INDEX IF NOT EXISTS "PaymentSubmission_proofHash_status_idx" ON "PaymentSubmission"("proofHash", "status");

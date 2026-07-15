-- Add generation-based limits to plans and subscriptions
ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS "monthlyGenerationLimit" INTEGER,
  ADD COLUMN IF NOT EXISTS "fasterGeneration" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "currentUsageGenerations" INTEGER NOT NULL DEFAULT 0;

-- Update Free plan: 1 custom voice, 2000 chars/gen, 10000 chars/month, 10 gens/month
UPDATE "Plan"
SET
  "maxCustomVoices" = 1,
  "monthlyGenerationLimit" = 10,
  "perGenerationCharacterLimit" = 2000,
  "monthlyCharacterLimit" = 10000,
  "premiumVoices" = false,
  "fasterGeneration" = false,
  "apiAccess" = false,
  "teamCollaboration" = false,
  "price" = 0
WHERE "id" = 'free';

-- Starter: 2 custom voices
UPDATE "Plan"
SET "maxCustomVoices" = 2
WHERE "id" = 'starter';

-- Creator: 5 custom voices
UPDATE "Plan"
SET "maxCustomVoices" = 5
WHERE "id" = 'creator';

-- Pro: unlimited custom voices, everything enabled
UPDATE "Plan"
SET
  "maxCustomVoices" = NULL,
  "premiumVoices" = true,
  "fasterGeneration" = true,
  "apiAccess" = true,
  "teamCollaboration" = true
WHERE "id" = 'pro';

CREATE INDEX IF NOT EXISTS "Subscription_currentUsageGenerations_idx" ON "Subscription"("currentUsageGenerations");
CREATE INDEX IF NOT EXISTS "Plan_monthlyGenerationLimit_idx" ON "Plan"("monthlyGenerationLimit");

-- Step 1: Add new columns to Plan with default values
ALTER TABLE "Plan" ADD COLUMN "apiAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Plan" ADD COLUMN "teamCollaboration" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Plan" ADD COLUMN "monthlyCharacterLimit" INTEGER NOT NULL DEFAULT 10000;
ALTER TABLE "Plan" ADD COLUMN "perGenerationCharacterLimit" INTEGER NOT NULL DEFAULT 2000;

-- Step 2: Update existing plans with correct values based on current data
-- Starter: 100,000 monthly, 3,000 per-generation
UPDATE "Plan" SET "monthlyCharacterLimit" = 100000, "perGenerationCharacterLimit" = 3000 WHERE "id" = 'starter';
-- Creator: 500,000 monthly, 15,000 per-generation
UPDATE "Plan" SET "monthlyCharacterLimit" = 500000, "perGenerationCharacterLimit" = 15000 WHERE "id" = 'creator';
-- Pro: 2,000,000 monthly, 50,000 per-generation
UPDATE "Plan" SET "monthlyCharacterLimit" = 2000000, "perGenerationCharacterLimit" = 50000 WHERE "id" = 'pro';

-- Step 3: Drop old columns
ALTER TABLE "Plan" DROP COLUMN "maxGenerationLength";
ALTER TABLE "Plan" DROP COLUMN "maxTotalChars";

-- Step 4: Rename columns in Subscription
ALTER TABLE "Subscription" RENAME COLUMN "monthlyCharacterUsage" TO "currentUsageCharacters";
ALTER TABLE "Subscription" RENAME COLUMN "usageResetAt" TO "usageResetDate";

-- Step 5: Drop old column in Subscription
ALTER TABLE "Subscription" DROP COLUMN "monthlyCustomVoiceUsage";

-- Step 6: Add subscriptionId to Generation
ALTER TABLE "Generation" ADD COLUMN "subscriptionId" TEXT;

-- Step 7: Create index on subscriptionId
CREATE INDEX "Generation_subscriptionId_idx" ON "Generation"("subscriptionId");

-- Step 8: Insert FREE plan
INSERT INTO "Plan" ("id", "name", "paystackPlanCode", "price", "maxCustomVoices", "perGenerationCharacterLimit", "monthlyCharacterLimit", "premiumVoices", "apiAccess", "teamCollaboration", "createdAt", "updatedAt")
VALUES ('free', 'Free', '', 0, 0, 2000, 10000, false, false, false, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

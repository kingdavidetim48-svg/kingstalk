-- Add maxTotalChars to Plan (missing from previous migrations)
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "maxTotalChars" INTEGER NOT NULL DEFAULT 0;

-- Backfill default values for existing rows
UPDATE "Plan" SET "maxTotalChars" = "maxGenerationLength" WHERE "maxTotalChars" = 0;

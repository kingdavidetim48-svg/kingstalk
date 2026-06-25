-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "charactersUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "monthlyCharacterLimit" DROP DEFAULT,
ALTER COLUMN "perGenerationCharacterLimit" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "usageResetDate" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Generation_orgId_createdAt_idx" ON "Generation"("orgId", "createdAt");

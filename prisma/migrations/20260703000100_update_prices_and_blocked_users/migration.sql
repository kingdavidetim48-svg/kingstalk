-- Update plan prices (stored in kobo: NGN 1 = 100)
UPDATE "Plan" SET "price" = 1300000 WHERE "id" = 'starter';   -- NGN 13,000
UPDATE "Plan" SET "price" = 2700000 WHERE "id" = 'creator';   -- NGN 27,000
UPDATE "Plan" SET "price" = 6800000 WHERE "id" = 'pro';       -- NGN 68,000

-- Create BlockedUser table
CREATE TABLE "BlockedUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "reason" TEXT,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedBy" TEXT NOT NULL,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlockedUser_userId_key" ON "BlockedUser"("userId");
CREATE INDEX "BlockedUser_email_idx" ON "BlockedUser"("email");
CREATE INDEX "BlockedUser_blockedAt_idx" ON "BlockedUser"("blockedAt");

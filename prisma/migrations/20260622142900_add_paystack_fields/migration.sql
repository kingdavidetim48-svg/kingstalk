-- Rename Plan.stripePriceId -> paystackPlanCode
ALTER TABLE "Plan" RENAME COLUMN "stripePriceId" TO "paystackPlanCode";
DROP INDEX IF EXISTS "Plan_stripePriceId_key";
CREATE UNIQUE INDEX "Plan_paystackPlanCode_key" ON "Plan"("paystackPlanCode");

-- Rename Subscription fields
ALTER TABLE "Subscription" RENAME COLUMN "stripeCustomerId" TO "paystackCustomerCode";
ALTER TABLE "Subscription" RENAME COLUMN "stripeSubscriptionId" TO "paystackSubscriptionCode";
DROP INDEX IF EXISTS "Subscription_stripeCustomerId_idx";
DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_idx";
DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_key";
CREATE INDEX "Subscription_paystackCustomerCode_idx" ON "Subscription"("paystackCustomerCode");
CREATE INDEX "Subscription_paystackSubscriptionCode_idx" ON "Subscription"("paystackSubscriptionCode");
CREATE UNIQUE INDEX "Subscription_paystackSubscriptionCode_key" ON "Subscription"("paystackSubscriptionCode");

-- CreateTable: Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "planId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX "Payment_orgId_idx" ON "Payment"("orgId");
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

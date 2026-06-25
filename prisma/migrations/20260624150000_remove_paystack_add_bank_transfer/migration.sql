-- Create PaymentStatus enum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Remove Paystack fields from Plan
DROP INDEX IF EXISTS "Plan_paystackPlanCode_key";
ALTER TABLE "Plan" DROP COLUMN "paystackPlanCode";

-- Remove Paystack fields from Subscription
DROP INDEX IF EXISTS "Subscription_paystackCustomerCode_idx";
DROP INDEX IF EXISTS "Subscription_paystackSubscriptionCode_idx";
DROP INDEX IF EXISTS "Subscription_paystackSubscriptionCode_key";
ALTER TABLE "Subscription" DROP COLUMN "paystackCustomerCode";
ALTER TABLE "Subscription" DROP COLUMN "paystackSubscriptionCode";

-- Drop Payment table
DROP INDEX IF EXISTS "Payment_orgId_idx";
DROP INDEX IF EXISTS "Payment_reference_idx";
DROP TABLE IF EXISTS "Payment";

-- Drop ManualPayment table
DROP INDEX IF EXISTS "ManualPayment_orgId_idx";
DROP INDEX IF EXISTS "ManualPayment_status_idx";
DROP TABLE IF EXISTS "ManualPayment";

-- Create PaymentSubmission table
CREATE TABLE "PaymentSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "transferReference" TEXT NOT NULL,
    "proofImageUrl" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentSubmission_userId_idx" ON "PaymentSubmission"("userId");
CREATE INDEX "PaymentSubmission_orgId_idx" ON "PaymentSubmission"("orgId");
CREATE INDEX "PaymentSubmission_status_idx" ON "PaymentSubmission"("status");

ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

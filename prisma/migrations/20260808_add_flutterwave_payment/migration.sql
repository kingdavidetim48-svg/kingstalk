-- CreateEnum
CREATE TYPE "FlwPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FlutterwavePayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ref" TEXT NOT NULL,
    "flwTxId" TEXT,
    "flwRef" TEXT,
    "status" "FlwPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'flutterwave',
    "metadata" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlutterwavePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlutterwavePayment_ref_key" ON "FlutterwavePayment"("ref");

-- CreateIndex
CREATE INDEX "FlutterwavePayment_userId_idx" ON "FlutterwavePayment"("userId");

-- CreateIndex
CREATE INDEX "FlutterwavePayment_orgId_idx" ON "FlutterwavePayment"("orgId");

-- CreateIndex
CREATE INDEX "FlutterwavePayment_status_idx" ON "FlutterwavePayment"("status");

-- CreateIndex
CREATE INDEX "FlutterwavePayment_ref_idx" ON "FlutterwavePayment"("ref");

-- CreateIndex
CREATE INDEX "FlutterwavePayment_planId_idx" ON "FlutterwavePayment"("planId");

-- AddForeignKey
ALTER TABLE "FlutterwavePayment" ADD CONSTRAINT "FlutterwavePayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

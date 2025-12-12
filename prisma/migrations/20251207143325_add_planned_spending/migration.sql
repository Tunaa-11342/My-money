-- CreateEnum
CREATE TYPE "PlannedPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "PlannedSpending" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" "PlannedPeriodType" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedSpending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlannedSpending_userId_periodType_periodKey_key" ON "PlannedSpending"("userId", "periodType", "periodKey");

-- AddForeignKey
ALTER TABLE "PlannedSpending" ADD CONSTRAINT "PlannedSpending_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

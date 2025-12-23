/*
  Warnings:

  - You are about to drop the column `updateAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - The `type` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `monthlyBudget` on the `UserSettings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - Added the required column `amount` to the `PlannedSpending` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `PlannedSpending` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `PlannedSpending` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `PlannedSpending` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `id` on table `UserSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "BudgetEnforcement" AS ENUM ('STRICT');

-- CreateEnum
CREATE TYPE "CarryPolicy" AS ENUM ('NET');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlannedPeriodType" ADD VALUE 'ONE_TIME';
ALTER TYPE "PlannedPeriodType" ADD VALUE 'DAILY';

-- AlterTable
ALTER TABLE "PlannedSpending" ADD COLUMN     "amount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "categoryIcon" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "periodType" SET DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2),
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'expense';

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "budgetEnforcement" "BudgetEnforcement" NOT NULL DEFAULT 'STRICT',
ADD COLUMN     "budgetStartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "carryPolicy" "CarryPolicy" NOT NULL DEFAULT 'NET',
ALTER COLUMN "monthlyBudget" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_date_idx" ON "Transaction"("userId", "type", "date");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

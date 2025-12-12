/*
  Warnings:

  - Added the required column `title` to the `PlannedSpending` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PlannedSpending_userId_periodType_periodKey_key";

-- AlterTable
ALTER TABLE "PlannedSpending" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PlannedSpending_userId_periodType_periodKey_idx" ON "PlannedSpending"("userId", "periodType", "periodKey");

-- CreateIndex
CREATE INDEX "PlannedSpending_userId_categoryId_periodType_periodKey_idx" ON "PlannedSpending"("userId", "categoryId", "periodType", "periodKey");

-- AddForeignKey
ALTER TABLE "PlannedSpending" ADD CONSTRAINT "PlannedSpending_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

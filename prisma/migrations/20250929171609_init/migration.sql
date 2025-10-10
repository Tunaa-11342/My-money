/*
  Warnings:

  - The primary key for the `UserSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currency` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MonthHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `YearHistory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserSettings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `theme` to the `UserSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_pkey",
DROP COLUMN "currency",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "theme" TEXT NOT NULL,
ADD CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "MonthHistory";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "YearHistory";

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

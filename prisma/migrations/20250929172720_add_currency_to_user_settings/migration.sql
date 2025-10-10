/*
  Warnings:

  - Added the required column `currency` to the `UserSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "currency" TEXT NOT NULL;

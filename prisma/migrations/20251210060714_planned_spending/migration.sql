-- AlterTable
ALTER TABLE "PlannedSpending" ADD COLUMN     "color" TEXT,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;

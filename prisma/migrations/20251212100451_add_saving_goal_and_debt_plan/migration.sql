-- CreateEnum
CREATE TYPE "DebtCategory" AS ENUM ('COLLECT', 'BORROW', 'LEND', 'REPAY');

-- CreateTable
CREATE TABLE "SavingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "currentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DebtCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingGoal_userId_idx" ON "SavingGoal"("userId");

-- CreateIndex
CREATE INDEX "SavingGoal_userId_isPinned_idx" ON "SavingGoal"("userId", "isPinned");

-- CreateIndex
CREATE INDEX "DebtPlan_userId_idx" ON "DebtPlan"("userId");

-- CreateIndex
CREATE INDEX "DebtPlan_userId_category_idx" ON "DebtPlan"("userId", "category");

-- CreateIndex
CREATE INDEX "DebtPlan_userId_isPinned_idx" ON "DebtPlan"("userId", "isPinned");

-- AddForeignKey
ALTER TABLE "SavingGoal" ADD CONSTRAINT "SavingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPlan" ADD CONSTRAINT "DebtPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

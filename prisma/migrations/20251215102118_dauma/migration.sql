-- CreateTable
CREATE TABLE "RecurringCashflowItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "periodType" TEXT NOT NULL,
    "dayOfMonth" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringCashflowItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringCashflowItem_userId_idx" ON "RecurringCashflowItem"("userId");

-- CreateIndex
CREATE INDEX "RecurringCashflowItem_userId_kind_idx" ON "RecurringCashflowItem"("userId", "kind");

-- AddForeignKey
ALTER TABLE "RecurringCashflowItem" ADD CONSTRAINT "RecurringCashflowItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpenseSource" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE "ExpenseSource" ADD COLUMN "spendingType" TEXT NOT NULL DEFAULT 'essential';

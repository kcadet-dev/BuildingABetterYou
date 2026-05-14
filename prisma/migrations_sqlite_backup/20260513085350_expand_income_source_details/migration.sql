-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IncomeSource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobName" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "nextPayDate" DATETIME NOT NULL,
    "isCash" BOOLEAN NOT NULL DEFAULT false,
    "compensationType" TEXT,
    "hourlyRate" DECIMAL,
    "hoursPerPeriod" DECIMAL,
    "estimatedTaxRate" DECIMAL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IncomeSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_IncomeSource" ("amount", "createdAt", "frequency", "id", "jobName", "nextPayDate", "updatedAt", "userId") SELECT "amount", "createdAt", "frequency", "id", "jobName", "nextPayDate", "updatedAt", "userId" FROM "IncomeSource";
DROP TABLE "IncomeSource";
ALTER TABLE "new_IncomeSource" RENAME TO "IncomeSource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

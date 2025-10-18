/*
  Warnings:

  - A unique constraint covering the columns `[providerRef]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `providerRef` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "providerRef" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_providerRef_key" ON "Transaction"("providerRef");

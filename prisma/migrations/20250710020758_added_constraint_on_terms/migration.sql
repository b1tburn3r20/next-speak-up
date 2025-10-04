/*
  Warnings:

  - A unique constraint covering the columns `[memberId,chamber,startYear]` on the table `congressterm` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `CongressTerm_memberId_chamber_startYear_key` ON `congressterm`(`memberId`, `chamber`, `startYear`);

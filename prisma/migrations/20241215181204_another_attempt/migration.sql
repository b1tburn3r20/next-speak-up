/*
  Warnings:

  - Added the required column `updatedAt` to the `CongressTerm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Depiction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LeadershipPosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PartyHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `congressmember` MODIFY `cosponsoredLegislationCount` INTEGER NULL,
    MODIFY `sponsoredLegislationCount` INTEGER NULL;

-- AlterTable
ALTER TABLE `congressterm` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `depiction` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `leadershipposition` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `partyhistory` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

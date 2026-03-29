/*
  Warnings:

  - A unique constraint covering the columns `[congress,chamber,rollNumber,session]` on the table `vote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Vote_congress_chamber_rollNumber_key` ON `vote`;

-- AlterTable
ALTER TABLE `vote` ADD COLUMN `identifier` VARCHAR(191) NULL,
    ADD COLUMN `legislationUrl` VARCHAR(500) NULL,
    ADD COLUMN `session` INTEGER NULL,
    ADD COLUMN `sourceDataUrl` VARCHAR(500) NULL,
    ADD COLUMN `sourceUpdated` DATETIME(3) NULL,
    ADD COLUMN `voteType` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Vote_voteType_idx` ON `vote`(`voteType`);

-- CreateIndex
CREATE UNIQUE INDEX `Vote_congress_chamber_rollNumber_session_key` ON `vote`(`congress`, `chamber`, `rollNumber`, `session`);

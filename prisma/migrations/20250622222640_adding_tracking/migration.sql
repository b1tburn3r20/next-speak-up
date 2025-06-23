-- AlterTable
ALTER TABLE `userbilltrack` ADD COLUMN `tracking` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `userbilltrack_tracking_idx` ON `userbilltrack`(`tracking`);

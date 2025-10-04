/*
  Warnings:

  - You are about to drop the column `ai_summary` on the `legislation` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `legislation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `legislation` DROP COLUMN `ai_summary`,
    DROP COLUMN `summary`;

-- CreateTable
CREATE TABLE `billsummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legislationId` INTEGER NOT NULL,
    `actionDate` DATETIME(3) NULL,
    `actionDesc` VARCHAR(191) NULL,
    `text` TEXT NULL,
    `updateDate` DATETIME(3) NULL,
    `versionCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `billsummary_legislationId_idx`(`legislationId`),
    INDEX `billsummary_actionDate_idx`(`actionDate`),
    INDEX `billsummary_actionDesc_idx`(`actionDesc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billaisummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legislationId` INTEGER NOT NULL,
    `actionDate` DATETIME(3) NULL,
    `type` VARCHAR(191) NULL,
    `text` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `billaisummary_legislationId_idx`(`legislationId`),
    INDEX `billaisummary_actionDate_idx`(`actionDate`),
    INDEX `billaisummary_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `billsummary` ADD CONSTRAINT `billsummary_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billaisummary` ADD CONSTRAINT `billaisummary_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

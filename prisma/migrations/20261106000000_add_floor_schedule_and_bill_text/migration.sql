-- CreateTable
CREATE TABLE `bill_text_content` (
    `billId` INTEGER NOT NULL,
    `versionType` VARCHAR(120) NOT NULL,
    `text` MEDIUMTEXT NOT NULL,
    `contentHash` CHAR(64) NOT NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `fetchedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`billId`, `versionType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `floor_schedule_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamberId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `weekOf` DATE NOT NULL,
    `sourceItemId` VARCHAR(40) NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `legislationRef` VARCHAR(120) NOT NULL,
    `title` TEXT NOT NULL,
    `billSlug` VARCHAR(80) NULL,
    `billId` INTEGER NULL,
    `stage` VARCHAR(120) NULL,
    `documentUrl` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NULL,
    `removedAt` DATETIME(3) NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `asOf` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `floor_schedule_item_weekOf_removedAt_idx`(`weekOf`, `removedAt`),
    INDEX `floor_schedule_item_billId_weekOf_idx`(`billId`, `weekOf`),
    UNIQUE INDEX `floor_schedule_item_chamberId_weekOf_sourceItemId_key`(`chamberId`, `weekOf`, `sourceItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bill_text_content` ADD CONSTRAINT `bill_text_content_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `floor_schedule_item` ADD CONSTRAINT `floor_schedule_item_chamberId_fkey` FOREIGN KEY (`chamberId`) REFERENCES `legislative_chamber`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `floor_schedule_item` ADD CONSTRAINT `floor_schedule_item_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `legislative_session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `floor_schedule_item` ADD CONSTRAINT `floor_schedule_item_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE `billaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legislationId` INTEGER NOT NULL,
    `actionDate` DATETIME(3) NOT NULL,
    `text` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `actionCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `billaction_legislationId_idx`(`legislationId`),
    INDEX `billaction_actionDate_idx`(`actionDate`),
    INDEX `billaction_type_idx`(`type`),
    INDEX `billaction_legislationId_actionDate_idx`(`legislationId`, `actionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `billaction` ADD CONSTRAINT `billaction_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

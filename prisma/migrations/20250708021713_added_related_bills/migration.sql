-- CreateTable
CREATE TABLE `relatedlegislation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legislationId` INTEGER NOT NULL,
    `relatedNameId` VARCHAR(191) NOT NULL,
    `relationshipType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `relatedlegislation_legislationId_idx`(`legislationId`),
    INDEX `relatedlegislation_relatedNameId_idx`(`relatedNameId`),
    UNIQUE INDEX `relatedlegislation_legislationId_relatedNameId_relationshipT_key`(`legislationId`, `relatedNameId`, `relationshipType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `relatedlegislation` ADD CONSTRAINT `relatedlegislation_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

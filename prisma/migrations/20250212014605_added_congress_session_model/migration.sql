-- CreateTable
CREATE TABLE `CongressSession` (
    `congress` INTEGER NOT NULL,
    `bioguideId` VARCHAR(191) NOT NULL,

    INDEX `CongressSession_congress_idx`(`congress`),
    INDEX `CongressSession_bioguideId_idx`(`bioguideId`),
    PRIMARY KEY (`congress`, `bioguideId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CongressSession` ADD CONSTRAINT `CongressSession_bioguideId_fkey` FOREIGN KEY (`bioguideId`) REFERENCES `CongressMember`(`bioguideId`) ON DELETE RESTRICT ON UPDATE CASCADE;

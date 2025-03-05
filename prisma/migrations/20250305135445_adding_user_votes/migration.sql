-- CreateTable
CREATE TABLE `UserVote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `votePosition` ENUM('YEA', 'NAY', 'PRESENT', 'NOT_VOTING') NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `legislationId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserVote_userId_idx`(`userId`),
    INDEX `UserVote_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `UserVote_legislationId_idx`(`legislationId`),
    UNIQUE INDEX `UserVote_userId_entityType_entityId_key`(`userId`, `entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserVote` ADD CONSTRAINT `UserVote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserVote` ADD CONSTRAINT `UserVote_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

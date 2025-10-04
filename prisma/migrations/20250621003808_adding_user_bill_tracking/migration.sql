-- CreateTable
CREATE TABLE `userbilltrack` (
    `userId` VARCHAR(191) NOT NULL,
    `legislationId` INTEGER NOT NULL,
    `hasViewed` BOOLEAN NOT NULL DEFAULT false,
    `viewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `userbilltrack_userId_idx`(`userId`),
    INDEX `userbilltrack_legislationId_idx`(`legislationId`),
    INDEX `userbilltrack_hasViewed_idx`(`hasViewed`),
    PRIMARY KEY (`userId`, `legislationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `userbilltrack` ADD CONSTRAINT `userbilltrack_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userbilltrack` ADD CONSTRAINT `userbilltrack_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

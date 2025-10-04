-- CreateTable
CREATE TABLE `guestaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuestAction_sessionId_idx`(`sessionId`),
    INDEX `GuestAction_action_idx`(`action`),
    INDEX `GuestAction_entityId_idx`(`entityId`),
    INDEX `GuestAction_createdAt_idx`(`createdAt`),
    INDEX `GuestAction_action_entityId_idx`(`action`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

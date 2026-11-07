-- AlterTable
ALTER TABLE `user` ADD COLUMN `leaderboardHiddenAt` DATETIME(3) NULL,
    ADD COLUMN `leaderboardOptIn` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `user_bill_skip` (
    `userId` VARCHAR(191) NOT NULL,
    `billId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_bill_skip_billId_idx`(`billId`),
    PRIMARY KEY (`userId`, `billId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xp_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `kind` ENUM('VOTE', 'AHEAD_OF_VOTE', 'DAILY_GOAL', 'CONTACTED_REP', 'ATTENDED_EVENT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `refKey` VARCHAR(80) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `xp_event_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `xp_event_createdAt_userId_idx`(`createdAt`, `userId`),
    UNIQUE INDEX `xp_event_userId_kind_refKey_key`(`userId`, `kind`, `refKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `civic_action` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CONTACTED_REP', 'ATTENDED_EVENT') NOT NULL,
    `billId` INTEGER NULL,
    `personId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `civic_action_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `civic_action_billId_idx`(`billId`),
    INDEX `civic_action_personId_idx`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_bill_skip` ADD CONSTRAINT `user_bill_skip_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bill_skip` ADD CONSTRAINT `user_bill_skip_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_event` ADD CONSTRAINT `xp_event_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_action` ADD CONSTRAINT `civic_action_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_action` ADD CONSTRAINT `civic_action_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_action` ADD CONSTRAINT `civic_action_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing votes keep the XP they earned. Same statements as prisma/xp-backfill.ts.
INSERT IGNORE INTO `xp_event` (userId, kind, amount, refKey, createdAt)
SELECT v.userId, 'VOTE', 10, CAST(v.billId AS CHAR), v.createdAt FROM `user_bill_vote` v;

INSERT IGNORE INTO `xp_event` (userId, kind, amount, refKey, createdAt)
SELECT v.userId, 'AHEAD_OF_VOTE', 5, CAST(v.billId AS CHAR), v.createdAt FROM `user_bill_vote` v
WHERE EXISTS (SELECT 1 FROM `floor_schedule_item` f WHERE f.billId = v.billId);

-- A fixed Eastern offset. Old daily goals can be an hour off around a clock change, which is harmless.
INSERT IGNORE INTO `xp_event` (userId, kind, amount, refKey, createdAt)
SELECT v.userId, 'DAILY_GOAL', 20, DATE_FORMAT(DATE_SUB(v.createdAt, INTERVAL 5 HOUR), '%Y-%m-%d'), MAX(v.createdAt)
FROM `user_bill_vote` v
GROUP BY v.userId, DATE_FORMAT(DATE_SUB(v.createdAt, INTERVAL 5 HOUR), '%Y-%m-%d')
HAVING COUNT(*) >= 3;

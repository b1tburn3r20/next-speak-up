-- AlterTable
ALTER TABLE `bugreport` ADD COLUMN `resolvedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `civic_action` ADD COLUMN `eventId` INTEGER NULL;

-- AlterTable
ALTER TABLE `featuresuggestion` ADD COLUMN `resolvedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user_location` ADD COLUMN `placeGeoid` VARCHAR(10) NULL,
    ADD COLUMN `upperDistrictId` INTEGER NULL;

-- CreateTable
CREATE TABLE `civic_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jurisdictionId` INTEGER NOT NULL,
    `kind` ENUM('COMMITTEE', 'SUBCOMMITTEE', 'HEARING', 'COUNCIL_MEETING', 'ELECTION', 'DEADLINE') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `hasTime` BOOLEAN NOT NULL DEFAULT true,
    `location` VARCHAR(255) NULL,
    `joinUrl` VARCHAR(500) NULL,
    `documentUrl` VARCHAR(500) NULL,
    `agenda` TEXT NULL,
    `status` ENUM('SCHEDULED', 'CANCELED') NOT NULL DEFAULT 'SCHEDULED',
    `sourceKey` VARCHAR(120) NOT NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `asOf` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `civic_event_sourceKey_key`(`sourceKey`),
    INDEX `civic_event_jurisdictionId_startsAt_idx`(`jurisdictionId`, `startsAt`),
    INDEX `civic_event_startsAt_idx`(`startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `civic_event_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `billId` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `civic_event_item_eventId_sortOrder_idx`(`eventId`, `sortOrder`),
    INDEX `civic_event_item_billId_idx`(`billId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profile` (
    `userId` VARCHAR(191) NOT NULL,
    `about` VARCHAR(500) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `showName` BOOLEAN NOT NULL DEFAULT false,
    `showAgeRange` BOOLEAN NOT NULL DEFAULT false,
    `showState` BOOLEAN NOT NULL DEFAULT false,
    `showDistrict` BOOLEAN NOT NULL DEFAULT false,
    `showIncome` BOOLEAN NOT NULL DEFAULT false,
    `showVotingTopics` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorId` VARCHAR(191) NULL,
    `actorName` VARCHAR(160) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `target` VARCHAR(191) NULL,
    `detail` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_audit_log_createdAt_idx`(`createdAt`),
    INDEX `admin_audit_log_action_createdAt_idx`(`action`, `createdAt`),
    INDEX `admin_audit_log_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `civic_action_eventId_idx` ON `civic_action`(`eventId`);

-- CreateIndex
CREATE INDEX `user_location_upperDistrictId_idx` ON `user_location`(`upperDistrictId`);

-- AddForeignKey
ALTER TABLE `user_location` ADD CONSTRAINT `user_location_upperDistrictId_fkey` FOREIGN KEY (`upperDistrictId`) REFERENCES `district`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_event` ADD CONSTRAINT `civic_event_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_event_item` ADD CONSTRAINT `civic_event_item_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `civic_event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_event_item` ADD CONSTRAINT `civic_event_item_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `civic_action` ADD CONSTRAINT `civic_action_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `civic_event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_profile` ADD CONSTRAINT `user_profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_log` ADD CONSTRAINT `admin_audit_log_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


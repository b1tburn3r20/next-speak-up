-- AlterTable
ALTER TABLE `city_profile` ADD COLUMN `lane` VARCHAR(8) NULL,
    ADD COLUMN `phone` VARCHAR(40) NULL,
    ADD COLUMN `address` VARCHAR(300) NULL,
    ADD COLUMN `clerkName` VARCHAR(120) NULL,
    ADD COLUMN `governmentType` VARCHAR(60) NULL,
    ADD COLUMN `meetingSchedule` VARCHAR(120) NULL,
    ADD COLUMN `speakInfo` VARCHAR(500) NULL,
    ADD COLUMN `directorySource` VARCHAR(120) NULL,
    ADD COLUMN `directoryAsOf` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `city_district` (
    `jurisdictionId` INTEGER NOT NULL,
    `chamber` ENUM('UPPER', 'LOWER', 'UNICAMERAL') NOT NULL,
    `code` VARCHAR(16) NOT NULL,
    `vintage` VARCHAR(16) NOT NULL,
    `share` DOUBLE NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`jurisdictionId`, `chamber`, `code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `city_district` ADD CONSTRAINT `city_district_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `city_profile`(`jurisdictionId`) ON DELETE CASCADE ON UPDATE CASCADE;

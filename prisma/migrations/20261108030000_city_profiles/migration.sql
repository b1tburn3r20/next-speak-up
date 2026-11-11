-- CreateTable
CREATE TABLE `city_profile` (
    `jurisdictionId` INTEGER NOT NULL,
    `placeGeoid` VARCHAR(10) NOT NULL,
    `regionCode` VARCHAR(8) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `population` INTEGER NULL,
    `populationYear` INTEGER NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `website` VARCHAR(300) NULL,
    `websiteStatus` ENUM('UNCHECKED', 'FOUND', 'NOT_FOUND', 'BLOCKED') NOT NULL DEFAULT 'UNCHECKED',
    `agendaUrl` VARCHAR(500) NULL,
    `agendaPlatform` VARCHAR(40) NULL,
    `officialsUrl` VARCHAR(500) NULL,
    `speakUrl` VARCHAR(500) NULL,
    `note` VARCHAR(500) NULL,
    `checkedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `city_profile_placeGeoid_key`(`placeGeoid`),
    INDEX `city_profile_regionCode_population_idx`(`regionCode`, `population`),
    UNIQUE INDEX `city_profile_regionCode_slug_key`(`regionCode`, `slug`),
    PRIMARY KEY (`jurisdictionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `city_profile` ADD CONSTRAINT `city_profile_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


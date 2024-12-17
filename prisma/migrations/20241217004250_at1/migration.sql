/*
  Warnings:

  - You are about to drop the `_cosponsors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_sponsors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_cosponsors` DROP FOREIGN KEY `_Cosponsors_A_fkey`;

-- DropForeignKey
ALTER TABLE `_cosponsors` DROP FOREIGN KEY `_Cosponsors_B_fkey`;

-- DropForeignKey
ALTER TABLE `_sponsors` DROP FOREIGN KEY `_Sponsors_A_fkey`;

-- DropForeignKey
ALTER TABLE `_sponsors` DROP FOREIGN KEY `_Sponsors_B_fkey`;

-- DropTable
DROP TABLE `_cosponsors`;

-- DropTable
DROP TABLE `_sponsors`;

-- CreateTable
CREATE TABLE `LegislationSponsor` (
    `legislationId` INTEGER NOT NULL,
    `sponsorId` INTEGER NOT NULL,

    INDEX `LegislationSponsor_sponsorId_idx`(`sponsorId`),
    PRIMARY KEY (`legislationId`, `sponsorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LegislationCosponsor` (
    `legislationId` INTEGER NOT NULL,
    `cosponsorId` INTEGER NOT NULL,

    INDEX `LegislationCosponsor_cosponsorId_idx`(`cosponsorId`),
    PRIMARY KEY (`legislationId`, `cosponsorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LegislationSponsor` ADD CONSTRAINT `LegislationSponsor_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationSponsor` ADD CONSTRAINT `LegislationSponsor_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationCosponsor` ADD CONSTRAINT `LegislationCosponsor_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationCosponsor` ADD CONSTRAINT `LegislationCosponsor_cosponsorId_fkey` FOREIGN KEY (`cosponsorId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

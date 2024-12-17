/*
  Warnings:

  - You are about to drop the `sponsoredlegislation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_cosponsors` DROP FOREIGN KEY `_Cosponsors_B_fkey`;

-- DropForeignKey
ALTER TABLE `latestaction` DROP FOREIGN KEY `LatestAction_legislation_id_fkey`;

-- DropForeignKey
ALTER TABLE `sponsoredlegislation` DROP FOREIGN KEY `SponsoredLegislation_policy_area_id_fkey`;

-- DropForeignKey
ALTER TABLE `sponsoredlegislation` DROP FOREIGN KEY `SponsoredLegislation_primary_sponsor_id_fkey`;

-- DropTable
DROP TABLE `sponsoredlegislation`;

-- CreateTable
CREATE TABLE `Legislation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NULL,
    `introducedDate` DATETIME(3) NULL,
    `number` VARCHAR(191) NULL,
    `title` TEXT NULL,
    `type` VARCHAR(191) NULL,
    `url` VARCHAR(500) NULL,
    `amendmentNumber` VARCHAR(191) NULL,
    `policy_area_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Sponsors` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Sponsors_AB_unique`(`A`, `B`),
    INDEX `_Sponsors_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Legislation` ADD CONSTRAINT `Legislation_policy_area_id_fkey` FOREIGN KEY (`policy_area_id`) REFERENCES `PolicyArea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatestAction` ADD CONSTRAINT `LatestAction_legislation_id_fkey` FOREIGN KEY (`legislation_id`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Sponsors` ADD CONSTRAINT `_Sponsors_A_fkey` FOREIGN KEY (`A`) REFERENCES `CongressMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Sponsors` ADD CONSTRAINT `_Sponsors_B_fkey` FOREIGN KEY (`B`) REFERENCES `Legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Cosponsors` ADD CONSTRAINT `_Cosponsors_B_fkey` FOREIGN KEY (`B`) REFERENCES `Legislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

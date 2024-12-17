/*
  Warnings:

  - You are about to drop the column `cosponsoring_member_id` on the `cosponsoredlegislation` table. All the data in the column will be lost.
  - You are about to drop the column `latest_action_id` on the `cosponsoredlegislation` table. All the data in the column will be lost.
  - Added the required column `primary_sponsor_id` to the `CosponsoredLegislation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cosponsoredlegislation` DROP FOREIGN KEY `CosponsoredLegislation_cosponsoring_member_id_fkey`;

-- DropForeignKey
ALTER TABLE `cosponsoredlegislation` DROP FOREIGN KEY `CosponsoredLegislation_latest_action_id_fkey`;

-- DropIndex
DROP INDEX `CosponsoredLegislation_latest_action_id_key` ON `cosponsoredlegislation`;

-- AlterTable
ALTER TABLE `cosponsoredlegislation` DROP COLUMN `cosponsoring_member_id`,
    DROP COLUMN `latest_action_id`,
    ADD COLUMN `primary_sponsor_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `CosponsoredLatestAction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action_date` DATETIME(3) NULL,
    `text` TEXT NULL,
    `legislation_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CosponsoredLatestAction_legislation_id_key`(`legislation_id`),
    INDEX `CosponsoredLatestAction_legislation_id_idx`(`legislation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CosponsoredCosponsors` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CosponsoredCosponsors_AB_unique`(`A`, `B`),
    INDEX `_CosponsoredCosponsors_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CosponsoredLegislation_primary_sponsor_id_idx` ON `CosponsoredLegislation`(`primary_sponsor_id`);

-- AddForeignKey
ALTER TABLE `CosponsoredLegislation` ADD CONSTRAINT `CosponsoredLegislation_primary_sponsor_id_fkey` FOREIGN KEY (`primary_sponsor_id`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CosponsoredLatestAction` ADD CONSTRAINT `CosponsoredLatestAction_legislation_id_fkey` FOREIGN KEY (`legislation_id`) REFERENCES `CosponsoredLegislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CosponsoredCosponsors` ADD CONSTRAINT `_CosponsoredCosponsors_A_fkey` FOREIGN KEY (`A`) REFERENCES `CongressMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CosponsoredCosponsors` ADD CONSTRAINT `_CosponsoredCosponsors_B_fkey` FOREIGN KEY (`B`) REFERENCES `CosponsoredLegislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

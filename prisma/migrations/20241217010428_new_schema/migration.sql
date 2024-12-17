/*
  Warnings:

  - The primary key for the `legislation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `legislationcosponsor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cosponsorId` on the `legislationcosponsor` table. All the data in the column will be lost.
  - The primary key for the `legislationsponsor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sponsorId` on the `legislationsponsor` table. All the data in the column will be lost.
  - Added the required column `cosponsorBioguideId` to the `LegislationCosponsor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sponsorBioguideId` to the `LegislationSponsor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `latestaction` DROP FOREIGN KEY `LatestAction_legislation_id_fkey`;

-- DropForeignKey
ALTER TABLE `legislationcosponsor` DROP FOREIGN KEY `LegislationCosponsor_cosponsorId_fkey`;

-- DropForeignKey
ALTER TABLE `legislationcosponsor` DROP FOREIGN KEY `LegislationCosponsor_legislationId_fkey`;

-- DropForeignKey
ALTER TABLE `legislationsponsor` DROP FOREIGN KEY `LegislationSponsor_legislationId_fkey`;

-- DropForeignKey
ALTER TABLE `legislationsponsor` DROP FOREIGN KEY `LegislationSponsor_sponsorId_fkey`;

-- AlterTable
ALTER TABLE `latestaction` MODIFY `legislation_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `legislation` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(255) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `legislationcosponsor` DROP PRIMARY KEY,
    DROP COLUMN `cosponsorId`,
    ADD COLUMN `cosponsorBioguideId` VARCHAR(191) NOT NULL,
    MODIFY `legislationId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`legislationId`, `cosponsorBioguideId`);

-- AlterTable
ALTER TABLE `legislationsponsor` DROP PRIMARY KEY,
    DROP COLUMN `sponsorId`,
    ADD COLUMN `sponsorBioguideId` VARCHAR(191) NOT NULL,
    MODIFY `legislationId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`legislationId`, `sponsorBioguideId`);

-- CreateIndex
CREATE INDEX `LegislationCosponsor_cosponsorBioguideId_idx` ON `LegislationCosponsor`(`cosponsorBioguideId`);

-- CreateIndex
CREATE INDEX `LegislationSponsor_sponsorBioguideId_idx` ON `LegislationSponsor`(`sponsorBioguideId`);

-- AddForeignKey
ALTER TABLE `LegislationSponsor` ADD CONSTRAINT `LegislationSponsor_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationSponsor` ADD CONSTRAINT `LegislationSponsor_sponsorBioguideId_fkey` FOREIGN KEY (`sponsorBioguideId`) REFERENCES `CongressMember`(`bioguideId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationCosponsor` ADD CONSTRAINT `LegislationCosponsor_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationCosponsor` ADD CONSTRAINT `LegislationCosponsor_cosponsorBioguideId_fkey` FOREIGN KEY (`cosponsorBioguideId`) REFERENCES `CongressMember`(`bioguideId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatestAction` ADD CONSTRAINT `LatestAction_legislation_id_fkey` FOREIGN KEY (`legislation_id`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

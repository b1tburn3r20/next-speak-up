/*
  Warnings:

  - You are about to alter the column `legislation_id` on the `latestaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `legislation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `legislation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Int`.
  - The primary key for the `legislationcosponsor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `legislationId` on the `legislationcosponsor` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `legislationsponsor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `legislationId` on the `legislationsponsor` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[name_id]` on the table `Legislation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name_id` to the `Legislation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `latestaction` DROP FOREIGN KEY `LatestAction_legislation_id_fkey`;

-- DropForeignKey
ALTER TABLE `legislationcosponsor` DROP FOREIGN KEY `LegislationCosponsor_legislationId_fkey`;

-- DropForeignKey
ALTER TABLE `legislationsponsor` DROP FOREIGN KEY `LegislationSponsor_legislationId_fkey`;

-- AlterTable
ALTER TABLE `latestaction` MODIFY `legislation_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `legislation` DROP PRIMARY KEY,
    ADD COLUMN `name_id` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `legislationcosponsor` DROP PRIMARY KEY,
    MODIFY `legislationId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`legislationId`, `cosponsorBioguideId`);

-- AlterTable
ALTER TABLE `legislationsponsor` DROP PRIMARY KEY,
    MODIFY `legislationId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`legislationId`, `sponsorBioguideId`);

-- CreateIndex
CREATE UNIQUE INDEX `Legislation_name_id_key` ON `Legislation`(`name_id`);

-- AddForeignKey
ALTER TABLE `LegislationSponsor` ADD CONSTRAINT `LegislationSponsor_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegislationCosponsor` ADD CONSTRAINT `LegislationCosponsor_legislationId_fkey` FOREIGN KEY (`legislationId`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatestAction` ADD CONSTRAINT `LatestAction_legislation_id_fkey` FOREIGN KEY (`legislation_id`) REFERENCES `Legislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

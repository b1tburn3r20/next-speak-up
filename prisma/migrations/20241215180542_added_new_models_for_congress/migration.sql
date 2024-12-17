/*
  Warnings:

  - You are about to drop the column `chamber` on the `congressmember` table. All the data in the column will be lost.
  - You are about to drop the column `endYear` on the `congressmember` table. All the data in the column will be lost.
  - You are about to drop the column `startYear` on the `congressmember` table. All the data in the column will be lost.
  - Added the required column `birthYear` to the `CongressMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cosponsoredLegislationCount` to the `CongressMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `CongressMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `honorificName` to the `CongressMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `CongressMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sponsoredLegislationCount` to the `CongressMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updateDate` to the `CongressMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `congressmember` DROP COLUMN `chamber`,
    DROP COLUMN `endYear`,
    DROP COLUMN `startYear`,
    ADD COLUMN `birthYear` VARCHAR(191) NOT NULL,
    ADD COLUMN `cosponsoredLegislationCount` INTEGER NOT NULL,
    ADD COLUMN `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN `honorificName` VARCHAR(191) NOT NULL,
    ADD COLUMN `lastName` VARCHAR(191) NOT NULL,
    ADD COLUMN `sponsoredLegislationCount` INTEGER NOT NULL,
    ADD COLUMN `updateDate` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `CongressTerm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamber` VARCHAR(191) NOT NULL,
    `startYear` INTEGER NOT NULL,
    `endYear` INTEGER NULL,
    `memberId` INTEGER NOT NULL,

    INDEX `CongressTerm_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartyHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyName` VARCHAR(191) NOT NULL,
    `partyAbbreviation` VARCHAR(191) NOT NULL,
    `startYear` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,

    INDEX `PartyHistory_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadershipPosition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `memberId` INTEGER NOT NULL,

    INDEX `LeadershipPosition_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Depiction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `attribution` VARCHAR(191) NULL,
    `memberId` INTEGER NOT NULL,

    UNIQUE INDEX `Depiction_memberId_key`(`memberId`),
    INDEX `Depiction_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CongressTerm` ADD CONSTRAINT `CongressTerm_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartyHistory` ADD CONSTRAINT `PartyHistory_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadershipPosition` ADD CONSTRAINT `LeadershipPosition_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Depiction` ADD CONSTRAINT `Depiction_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

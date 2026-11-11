-- CreateTable
CREATE TABLE `member_sponsored_bill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `personId` INTEGER NOT NULL,
    `congress` INTEGER NOT NULL,
    `billType` VARCHAR(12) NOT NULL,
    `number` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `policyArea` VARCHAR(120) NULL,
    `introducedDate` DATE NULL,
    `latestActionDate` DATE NULL,
    `latestActionText` TEXT NULL,
    `becameLaw` BOOLEAN NOT NULL DEFAULT false,

    INDEX `member_sponsored_bill_personId_policyArea_latestActionDate_idx`(`personId`, `policyArea`, `latestActionDate`),
    INDEX `member_sponsored_bill_personId_becameLaw_idx`(`personId`, `becameLaw`),
    UNIQUE INDEX `member_sponsored_bill_personId_congress_billType_number_key`(`personId`, `congress`, `billType`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member_sponsored_bill` ADD CONSTRAINT `member_sponsored_bill_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


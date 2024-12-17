-- CreateTable
CREATE TABLE `SponsoredLegislation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NOT NULL,
    `introduceddate` DATETIME(3) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `url` VARCHAR(191) NOT NULL,
    `amendmentnumber` VARCHAR(191) NOT NULL,
    `policy_area_id` INTEGER NULL,
    `primary_sponsor_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SponsoredLegislation_primary_sponsor_id_idx`(`primary_sponsor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PolicyArea` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LatestAction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action_date` DATETIME(3) NULL,
    `text` VARCHAR(191) NULL,
    `legislation_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LatestAction_legislation_id_key`(`legislation_id`),
    INDEX `LatestAction_legislation_id_idx`(`legislation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Cosponsors` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Cosponsors_AB_unique`(`A`, `B`),
    INDEX `_Cosponsors_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SponsoredLegislation` ADD CONSTRAINT `SponsoredLegislation_policy_area_id_fkey` FOREIGN KEY (`policy_area_id`) REFERENCES `PolicyArea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SponsoredLegislation` ADD CONSTRAINT `SponsoredLegislation_primary_sponsor_id_fkey` FOREIGN KEY (`primary_sponsor_id`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LatestAction` ADD CONSTRAINT `LatestAction_legislation_id_fkey` FOREIGN KEY (`legislation_id`) REFERENCES `SponsoredLegislation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Cosponsors` ADD CONSTRAINT `_Cosponsors_A_fkey` FOREIGN KEY (`A`) REFERENCES `CongressMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Cosponsors` ADD CONSTRAINT `_Cosponsors_B_fkey` FOREIGN KEY (`B`) REFERENCES `SponsoredLegislation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

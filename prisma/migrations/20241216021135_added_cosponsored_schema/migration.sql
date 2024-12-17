-- CreateTable
CREATE TABLE `CosponsoredLegislation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NULL,
    `introduceddate` DATETIME(3) NULL,
    `number` VARCHAR(191) NULL,
    `title` TEXT NULL,
    `type` VARCHAR(191) NULL,
    `url` VARCHAR(500) NULL,
    `amendmentnumber` VARCHAR(191) NULL,
    `policy_area_id` INTEGER NULL,
    `latest_action_id` INTEGER NULL,
    `cosponsoring_member_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CosponsoredLegislation_latest_action_id_key`(`latest_action_id`),
    INDEX `CosponsoredLegislation_cosponsoring_member_id_idx`(`cosponsoring_member_id`),
    INDEX `CosponsoredLegislation_policy_area_id_idx`(`policy_area_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CosponsoredLegislation` ADD CONSTRAINT `CosponsoredLegislation_policy_area_id_fkey` FOREIGN KEY (`policy_area_id`) REFERENCES `PolicyArea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CosponsoredLegislation` ADD CONSTRAINT `CosponsoredLegislation_latest_action_id_fkey` FOREIGN KEY (`latest_action_id`) REFERENCES `LatestAction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CosponsoredLegislation` ADD CONSTRAINT `CosponsoredLegislation_cosponsoring_member_id_fkey` FOREIGN KEY (`cosponsoring_member_id`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

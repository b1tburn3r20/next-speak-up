-- CreateTable
CREATE TABLE `Vote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NOT NULL,
    `chamber` ENUM('HOUSE', 'SENATE') NOT NULL,
    `rollNumber` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `question` TEXT NULL,
    `result` VARCHAR(191) NULL,
    `billNumber` VARCHAR(191) NULL,
    `name_id` VARCHAR(191) NULL,
    `totalYea` INTEGER NOT NULL,
    `totalNay` INTEGER NOT NULL,
    `totalNotVoting` INTEGER NOT NULL,
    `totalPresent` INTEGER NOT NULL DEFAULT 0,
    `totalVoting` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vote_congress_idx`(`congress`),
    INDEX `Vote_date_idx`(`date`),
    INDEX `Vote_name_id_idx`(`name_id`),
    UNIQUE INDEX `Vote_congress_chamber_rollNumber_key`(`congress`, `chamber`, `rollNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MemberVote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voteId` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,
    `votePosition` ENUM('YEA', 'NAY', 'PRESENT', 'NOT_VOTING') NOT NULL,
    `party` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MemberVote_voteId_idx`(`voteId`),
    INDEX `MemberVote_memberId_idx`(`memberId`),
    UNIQUE INDEX `MemberVote_voteId_memberId_key`(`voteId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_name_id_fkey` FOREIGN KEY (`name_id`) REFERENCES `Legislation`(`name_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemberVote` ADD CONSTRAINT `MemberVote_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `Vote`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemberVote` ADD CONSTRAINT `MemberVote_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `CongressMember`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

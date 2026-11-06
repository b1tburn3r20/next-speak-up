-- AlterTable
ALTER TABLE `member_stat` ADD COLUMN `lawEligibleCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `user_policy_topic` (
    `userId` VARCHAR(191) NOT NULL,
    `policyArea` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `policyArea`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE FULLTEXT INDEX `bill_title_idx` ON `bill`(`title`);

-- AddForeignKey
ALTER TABLE `user_policy_topic` ADD CONSTRAINT `user_policy_topic_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE `FavoritedCongressMember` (
    `userId` VARCHAR(191) NOT NULL,
    `memberId` INTEGER NOT NULL,
    `favoritedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoritedCongressMember_memberId_idx`(`memberId`),
    INDEX `FavoritedCongressMember_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `memberId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FavoritedCongressMember` ADD CONSTRAINT `FavoritedCongressMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoritedCongressMember` ADD CONSTRAINT `FavoritedCongressMember_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `CongressMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

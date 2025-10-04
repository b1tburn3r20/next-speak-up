-- CreateTable
CREATE TABLE `bugreport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bug` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userRole` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bugreport_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `featuresuggestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `feature` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userRole` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `featuresuggestion_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bugreport` ADD CONSTRAINT `bugreport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `featuresuggestion` ADD CONSTRAINT `featuresuggestion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

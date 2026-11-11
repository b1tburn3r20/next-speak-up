-- CreateTable
CREATE TABLE `push_subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(700) NOT NULL,
    `p256dh` VARCHAR(200) NOT NULL,
    `auth` VARCHAR(100) NOT NULL,
    `userAgent` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSuccessAt` DATETIME(3) NULL,
    `failures` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `push_subscription_endpoint_key`(`endpoint`),
    INDEX `push_subscription_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_delivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CITY_MEETING', 'FLOOR_WEEK', 'VOTE_RESULT', 'BECAME_LAW', 'TEST') NOT NULL,
    `refKey` VARCHAR(120) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body` VARCHAR(500) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `reached` INTEGER NOT NULL DEFAULT 0,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `notification_delivery_userId_sentAt_idx`(`userId`, `sentAt`),
    INDEX `notification_delivery_kind_refKey_idx`(`kind`, `refKey`),
    UNIQUE INDEX `notification_delivery_userId_kind_refKey_key`(`userId`, `kind`, `refKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `push_subscription` ADD CONSTRAINT `push_subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_delivery` ADD CONSTRAINT `notification_delivery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


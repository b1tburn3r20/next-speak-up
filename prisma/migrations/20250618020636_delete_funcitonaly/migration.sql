-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `account_userId_fkey`;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

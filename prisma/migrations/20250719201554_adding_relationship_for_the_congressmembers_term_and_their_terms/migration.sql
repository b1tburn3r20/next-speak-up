-- AddForeignKey
ALTER TABLE `congressterm` ADD CONSTRAINT `congressterm_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `congressmember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

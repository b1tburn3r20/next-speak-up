-- AddForeignKey
ALTER TABLE `depiction` ADD CONSTRAINT `depiction_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `congressmember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

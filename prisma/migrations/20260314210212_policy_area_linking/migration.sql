-- AddForeignKey
ALTER TABLE `legislation` ADD CONSTRAINT `legislation_policy_area_id_fkey` FOREIGN KEY (`policy_area_id`) REFERENCES `policyarea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vote` ADD CONSTRAINT `vote_name_id_fkey` FOREIGN KEY (`name_id`) REFERENCES `legislation`(`name_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membervote` ADD CONSTRAINT `membervote_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `vote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

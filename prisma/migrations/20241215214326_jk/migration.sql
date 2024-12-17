-- AlterTable
ALTER TABLE `latestaction` MODIFY `text` TEXT NULL;

-- AlterTable
ALTER TABLE `sponsoredlegislation` MODIFY `title` TEXT NULL,
    MODIFY `url` VARCHAR(500) NULL;

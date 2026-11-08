-- City officials, and meeting documents beyond the agenda.

-- AlterTable
ALTER TABLE `office_term` MODIFY `role` ENUM('SENATOR', 'REPRESENTATIVE', 'DELEGATE', 'RESIDENT_COMMISSIONER', 'LEGISLATOR', 'MAYOR', 'COUNCIL_MEMBER') NOT NULL;

-- AlterTable
ALTER TABLE `person` ADD COLUMN `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `civic_event` ADD COLUMN `minutesUrl` VARCHAR(500) NULL,
    ADD COLUMN `videoUrl` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `civic_event_item` ADD COLUMN `section` VARCHAR(80) NULL;

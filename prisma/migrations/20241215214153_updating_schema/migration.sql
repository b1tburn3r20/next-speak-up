-- AlterTable
ALTER TABLE `congressmember` MODIFY `name` VARCHAR(191) NULL,
    MODIFY `role` VARCHAR(191) NULL,
    MODIFY `state` VARCHAR(191) NULL,
    MODIFY `party` VARCHAR(191) NULL,
    MODIFY `birthYear` VARCHAR(191) NULL,
    MODIFY `firstName` VARCHAR(191) NULL,
    MODIFY `honorificName` VARCHAR(191) NULL,
    MODIFY `lastName` VARCHAR(191) NULL,
    MODIFY `updateDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `congressterm` MODIFY `chamber` VARCHAR(191) NULL,
    MODIFY `startYear` INTEGER NULL;

-- AlterTable
ALTER TABLE `depiction` MODIFY `imageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `leadershipposition` MODIFY `congress` INTEGER NULL,
    MODIFY `type` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `partyhistory` MODIFY `partyName` VARCHAR(191) NULL,
    MODIFY `partyAbbreviation` VARCHAR(191) NULL,
    MODIFY `startYear` INTEGER NULL;

-- AlterTable
ALTER TABLE `sponsoredlegislation` MODIFY `congress` INTEGER NULL,
    MODIFY `introduceddate` DATETIME(3) NULL,
    MODIFY `number` VARCHAR(191) NULL,
    MODIFY `title` VARCHAR(191) NULL,
    MODIFY `url` VARCHAR(191) NULL,
    MODIFY `amendmentnumber` VARCHAR(191) NULL;

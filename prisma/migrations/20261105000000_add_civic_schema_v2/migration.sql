-- CreateTable
CREATE TABLE `jurisdiction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(16) NOT NULL,
    `ocdId` VARCHAR(191) NULL,
    `name` VARCHAR(120) NOT NULL,
    `level` ENUM('FEDERAL', 'STATE', 'TERRITORY', 'LOCAL') NOT NULL,
    `parentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jurisdiction_code_key`(`code`),
    UNIQUE INDEX `jurisdiction_ocdId_key`(`ocdId`),
    INDEX `jurisdiction_level_idx`(`level`),
    INDEX `jurisdiction_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legislative_chamber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jurisdictionId` INTEGER NOT NULL,
    `kind` ENUM('UPPER', 'LOWER', 'UNICAMERAL') NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `shortName` VARCHAR(40) NOT NULL,
    `seatCount` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `legislative_chamber_jurisdictionId_kind_key`(`jurisdictionId`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legislative_session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jurisdictionId` INTEGER NOT NULL,
    `identifier` VARCHAR(40) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `legislative_session_jurisdictionId_isCurrent_idx`(`jurisdictionId`, `isCurrent`),
    UNIQUE INDEX `legislative_session_jurisdictionId_identifier_key`(`jurisdictionId`, `identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `district` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamberId` INTEGER NOT NULL,
    `regionCode` VARCHAR(8) NOT NULL,
    `code` VARCHAR(16) NOT NULL,
    `name` VARCHAR(120) NULL,
    `ocdId` VARCHAR(191) NULL,
    `vintage` VARCHAR(16) NOT NULL DEFAULT '119',
    `seats` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `district_regionCode_idx`(`regionCode`),
    UNIQUE INDEX `district_chamberId_regionCode_code_vintage_key`(`chamberId`, `regionCode`, `code`, `vintage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(160) NOT NULL,
    `sortName` VARCHAR(160) NOT NULL,
    `firstName` VARCHAR(80) NULL,
    `middleName` VARCHAR(80) NULL,
    `lastName` VARCHAR(80) NULL,
    `honorific` VARCHAR(20) NULL,
    `birthYear` INTEGER NULL,
    `imageUrl` VARCHAR(500) NULL,
    `imageAttribution` TEXT NULL,
    `websiteUrl` VARCHAR(500) NULL,
    `phone` VARCHAR(40) NULL,
    `officeAddress` VARCHAR(255) NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `person_lastName_idx`(`lastName`),
    INDEX `person_sortName_idx`(`sortName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_identifier` (
    `personId` INTEGER NOT NULL,
    `scheme` VARCHAR(40) NOT NULL,
    `value` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `person_identifier_scheme_value_key`(`scheme`, `value`),
    PRIMARY KEY (`personId`, `scheme`, `value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_term` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `personId` INTEGER NOT NULL,
    `chamberId` INTEGER NOT NULL,
    `districtId` INTEGER NULL,
    `regionCode` VARCHAR(8) NOT NULL,
    `role` ENUM('SENATOR', 'REPRESENTATIVE', 'DELEGATE', 'RESIDENT_COMMISSIONER', 'LEGISLATOR') NOT NULL,
    `party` VARCHAR(8) NULL,
    `partyName` VARCHAR(60) NULL,
    `startYear` INTEGER NOT NULL,
    `endYear` INTEGER NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `office_term_chamberId_regionCode_isCurrent_idx`(`chamberId`, `regionCode`, `isCurrent`),
    INDEX `office_term_districtId_isCurrent_idx`(`districtId`, `isCurrent`),
    INDEX `office_term_isCurrent_party_idx`(`isCurrent`, `party`),
    UNIQUE INDEX `office_term_personId_chamberId_startYear_key`(`personId`, `chamberId`, `startYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jurisdictionId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `originChamberId` INTEGER NULL,
    `billType` VARCHAR(16) NOT NULL,
    `number` INTEGER NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `title` TEXT NOT NULL,
    `policyArea` VARCHAR(120) NULL,
    `introducedDate` DATE NULL,
    `currentStatus` ENUM('INTRODUCED', 'IN_COMMITTEE', 'REPORTED', 'PASSED_ORIGIN_CHAMBER', 'PASSED_BOTH_CHAMBERS', 'AGREED_TO', 'RESOLVING_DIFFERENCES', 'TO_EXECUTIVE', 'SIGNED', 'VETOED', 'VETO_OVERRIDDEN', 'BECAME_LAW', 'FAILED') NOT NULL DEFAULT 'INTRODUCED',
    `statusDate` DATE NULL,
    `latestActionDate` DATE NULL,
    `latestActionText` TEXT NULL,
    `lawNumber` VARCHAR(40) NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bill_slug_key`(`slug`),
    INDEX `bill_jurisdictionId_latestActionDate_id_idx`(`jurisdictionId`, `latestActionDate`, `id`),
    INDEX `bill_currentStatus_latestActionDate_idx`(`currentStatus`, `latestActionDate`),
    INDEX `bill_policyArea_latestActionDate_idx`(`policyArea`, `latestActionDate`),
    UNIQUE INDEX `bill_sessionId_billType_number_key`(`sessionId`, `billType`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_action_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billId` INTEGER NOT NULL,
    `actionDate` DATE NOT NULL,
    `actionTime` VARCHAR(16) NULL,
    `actionCode` VARCHAR(20) NULL,
    `type` VARCHAR(40) NULL,
    `text` TEXT NOT NULL,
    `sourceSystem` VARCHAR(60) NULL,
    `rollCallId` INTEGER NULL,
    `contentHash` CHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bill_action_event_billId_actionDate_idx`(`billId`, `actionDate`),
    INDEX `bill_action_event_actionCode_idx`(`actionCode`),
    INDEX `bill_action_event_rollCallId_idx`(`rollCallId`),
    UNIQUE INDEX `bill_action_event_billId_contentHash_key`(`billId`, `contentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_sponsorship` (
    `billId` INTEGER NOT NULL,
    `personId` INTEGER NOT NULL,
    `kind` ENUM('SPONSOR', 'COSPONSOR') NOT NULL,
    `isOriginal` BOOLEAN NOT NULL DEFAULT false,
    `sponsoredAt` DATE NULL,
    `withdrawnAt` DATE NULL,

    INDEX `bill_sponsorship_personId_kind_idx`(`personId`, `kind`),
    PRIMARY KEY (`billId`, `personId`, `kind`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_title` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billId` INTEGER NOT NULL,
    `titleType` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `versionCode` VARCHAR(20) NULL,
    `contentHash` CHAR(64) NOT NULL,

    UNIQUE INDEX `bill_title_billId_contentHash_key`(`billId`, `contentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_subject` (
    `billId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    INDEX `bill_subject_name_idx`(`name`),
    PRIMARY KEY (`billId`, `name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_relation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billId` INTEGER NOT NULL,
    `relatedBillId` INTEGER NULL,
    `relatedSlug` VARCHAR(80) NOT NULL,
    `relatedTitle` TEXT NULL,
    `relationType` VARCHAR(120) NOT NULL,
    `identifiedBy` VARCHAR(60) NOT NULL,

    INDEX `bill_relation_relatedSlug_idx`(`relatedSlug`),
    INDEX `bill_relation_relatedBillId_idx`(`relatedBillId`),
    UNIQUE INDEX `bill_relation_billId_relatedSlug_relationType_identifiedBy_key`(`billId`, `relatedSlug`, `relationType`, `identifiedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_text_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billId` INTEGER NOT NULL,
    `versionType` VARCHAR(120) NOT NULL,
    `issuedOn` DATETIME(3) NULL,
    `htmlUrl` VARCHAR(500) NULL,
    `pdfUrl` VARCHAR(500) NULL,
    `xmlUrl` VARCHAR(500) NULL,

    UNIQUE INDEX `bill_text_version_billId_versionType_key`(`billId`, `versionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_summary_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billId` INTEGER NOT NULL,
    `source` ENUM('CRS', 'AI') NOT NULL DEFAULT 'CRS',
    `versionCode` VARCHAR(20) NULL,
    `actionDate` DATE NULL,
    `actionDesc` VARCHAR(255) NULL,
    `text` MEDIUMTEXT NOT NULL,
    `contentHash` CHAR(64) NOT NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bill_summary_version_billId_actionDate_idx`(`billId`, `actionDate`),
    UNIQUE INDEX `bill_summary_version_billId_source_contentHash_key`(`billId`, `source`, `contentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roll_call` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jurisdictionId` INTEGER NOT NULL,
    `chamberId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `subSession` INTEGER NOT NULL DEFAULT 1,
    `number` INTEGER NOT NULL,
    `billId` INTEGER NULL,
    `legislationRef` VARCHAR(80) NULL,
    `question` TEXT NULL,
    `description` TEXT NULL,
    `voteType` VARCHAR(80) NULL,
    `result` VARCHAR(120) NULL,
    `occurredAt` DATETIME(3) NULL,
    `totalYea` INTEGER NOT NULL DEFAULT 0,
    `totalNay` INTEGER NOT NULL DEFAULT 0,
    `totalPresent` INTEGER NOT NULL DEFAULT 0,
    `totalNotVoting` INTEGER NOT NULL DEFAULT 0,
    `source` ENUM('CONGRESS_GOV', 'HOUSE_CLERK', 'VOTEVIEW') NOT NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `asOf` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `roll_call_billId_idx`(`billId`),
    INDEX `roll_call_chamberId_occurredAt_idx`(`chamberId`, `occurredAt`),
    UNIQUE INDEX `roll_call_chamberId_sessionId_subSession_number_key`(`chamberId`, `sessionId`, `subSession`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roll_call_position` (
    `rollCallId` INTEGER NOT NULL,
    `personId` INTEGER NOT NULL,
    `position` ENUM('YEA', 'NAY', 'PRESENT', 'NOT_VOTING') NOT NULL,
    `party` VARCHAR(8) NULL,
    `regionCode` VARCHAR(8) NULL,

    INDEX `roll_call_position_personId_rollCallId_idx`(`personId`, `rollCallId`),
    PRIMARY KEY (`rollCallId`, `personId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_location` (
    `userId` VARCHAR(191) NOT NULL,
    `jurisdictionId` INTEGER NOT NULL,
    `regionCode` VARCHAR(8) NOT NULL,
    `districtId` INTEGER NULL,
    `source` ENUM('BROWSER', 'ADDRESS', 'MANUAL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_location_districtId_idx`(`districtId`),
    PRIMARY KEY (`userId`, `jurisdictionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_bill_vote` (
    `userId` VARCHAR(191) NOT NULL,
    `billId` INTEGER NOT NULL,
    `position` ENUM('YEA', 'NAY', 'PRESENT', 'NOT_VOTING') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_bill_vote_billId_position_idx`(`billId`, `position`),
    INDEX `user_bill_vote_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`userId`, `billId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_bill_follow` (
    `userId` VARCHAR(191) NOT NULL,
    `billId` INTEGER NOT NULL,
    `following` BOOLEAN NOT NULL DEFAULT false,
    `viewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_bill_follow_userId_following_idx`(`userId`, `following`),
    INDEX `user_bill_follow_userId_viewedAt_idx`(`userId`, `viewedAt`),
    PRIMARY KEY (`userId`, `billId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_person_favorite` (
    `userId` VARCHAR(191) NOT NULL,
    `personId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_person_favorite_personId_idx`(`personId`),
    PRIMARY KEY (`userId`, `personId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_rep_alignment` (
    `userId` VARCHAR(191) NOT NULL,
    `personId` INTEGER NOT NULL,
    `policyArea` VARCHAR(120) NOT NULL DEFAULT '',
    `comparedVotes` INTEGER NOT NULL DEFAULT 0,
    `matchedVotes` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_rep_alignment_personId_idx`(`personId`),
    PRIMARY KEY (`userId`, `personId`, `policyArea`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_password` (
    `userId` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jurisdiction` ADD CONSTRAINT `jurisdiction_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `jurisdiction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legislative_chamber` ADD CONSTRAINT `legislative_chamber_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `legislative_session` ADD CONSTRAINT `legislative_session_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `district` ADD CONSTRAINT `district_chamberId_fkey` FOREIGN KEY (`chamberId`) REFERENCES `legislative_chamber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_identifier` ADD CONSTRAINT `person_identifier_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `office_term` ADD CONSTRAINT `office_term_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `office_term` ADD CONSTRAINT `office_term_chamberId_fkey` FOREIGN KEY (`chamberId`) REFERENCES `legislative_chamber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `office_term` ADD CONSTRAINT `office_term_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `district`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `legislative_session`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill` ADD CONSTRAINT `bill_originChamberId_fkey` FOREIGN KEY (`originChamberId`) REFERENCES `legislative_chamber`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_action_event` ADD CONSTRAINT `bill_action_event_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_action_event` ADD CONSTRAINT `bill_action_event_rollCallId_fkey` FOREIGN KEY (`rollCallId`) REFERENCES `roll_call`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_sponsorship` ADD CONSTRAINT `bill_sponsorship_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_sponsorship` ADD CONSTRAINT `bill_sponsorship_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_title` ADD CONSTRAINT `bill_title_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_subject` ADD CONSTRAINT `bill_subject_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_relation` ADD CONSTRAINT `bill_relation_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_relation` ADD CONSTRAINT `bill_relation_relatedBillId_fkey` FOREIGN KEY (`relatedBillId`) REFERENCES `bill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_text_version` ADD CONSTRAINT `bill_text_version_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_summary_version` ADD CONSTRAINT `bill_summary_version_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roll_call` ADD CONSTRAINT `roll_call_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roll_call` ADD CONSTRAINT `roll_call_chamberId_fkey` FOREIGN KEY (`chamberId`) REFERENCES `legislative_chamber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roll_call` ADD CONSTRAINT `roll_call_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `legislative_session`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roll_call` ADD CONSTRAINT `roll_call_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roll_call_position` ADD CONSTRAINT `roll_call_position_rollCallId_fkey` FOREIGN KEY (`rollCallId`) REFERENCES `roll_call`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roll_call_position` ADD CONSTRAINT `roll_call_position_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_location` ADD CONSTRAINT `user_location_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_location` ADD CONSTRAINT `user_location_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `jurisdiction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_location` ADD CONSTRAINT `user_location_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `district`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bill_vote` ADD CONSTRAINT `user_bill_vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bill_vote` ADD CONSTRAINT `user_bill_vote_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bill_follow` ADD CONSTRAINT `user_bill_follow_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_bill_follow` ADD CONSTRAINT `user_bill_follow_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_person_favorite` ADD CONSTRAINT `user_person_favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_person_favorite` ADD CONSTRAINT `user_person_favorite_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_rep_alignment` ADD CONSTRAINT `user_rep_alignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_rep_alignment` ADD CONSTRAINT `user_rep_alignment_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_password` ADD CONSTRAINT `user_password_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ageRange` ENUM('UNDER_18', 'FROM_18_TO_24', 'FROM_25_TO_34', 'FROM_35_TO_44', 'FROM_45_TO_54', 'FROM_55_TO_64', 'FROM_65_TO_74', 'OVER_75', 'PREFER_NOT_TO_SAY') NULL,
    `householdIncome` ENUM('UNDER_25000', 'FROM_25000_TO_49999', 'FROM_50000_TO_74999', 'FROM_75000_TO_99999', 'FROM_100000_TO_149999', 'FROM_150000_TO_199999', 'OVER_200000', 'PREFER_NOT_TO_SAY') NULL,
    `state` VARCHAR(191) NULL,
    `needsOnboarding` BOOLEAN NULL DEFAULT true,
    `roleId` INTEGER NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `user_roleId_fkey`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `useraction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `userRole` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserAction_userId_idx`(`userId`),
    INDEX `UserAction_userRole_idx`(`userRole`),
    INDEX `UserAction_action_idx`(`action`),
    INDEX `UserAction_createdAt_idx`(`createdAt`),
    INDEX `UserAction_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `refresh_token_expires_in` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Account_userId_key`(`userId`),
    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificationtoken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authenticator` (
    `credentialID` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `credentialPublicKey` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL,
    `credentialDeviceType` VARCHAR(191) NOT NULL,
    `credentialBackedUp` BOOLEAN NOT NULL,
    `transports` VARCHAR(191) NULL,

    UNIQUE INDEX `Authenticator_credentialID_key`(`credentialID`),
    PRIMARY KEY (`userId`, `credentialID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `congresssession` (
    `congress` INTEGER NOT NULL,
    `bioguideId` VARCHAR(191) NOT NULL,

    INDEX `CongressSession_bioguideId_idx`(`bioguideId`),
    INDEX `CongressSession_congress_idx`(`congress`),
    PRIMARY KEY (`congress`, `bioguideId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `congressmember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bioguideId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `party` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `birthYear` VARCHAR(191) NULL,
    `cosponsoredLegislationCount` INTEGER NULL,
    `firstName` VARCHAR(191) NULL,
    `honorificName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `sponsoredLegislationCount` INTEGER NULL,
    `updateDate` DATETIME(3) NULL,
    `contact` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `missingContactInfo` BOOLEAN NULL,
    `district` VARCHAR(191) NULL,

    UNIQUE INDEX `CongressMember_bioguideId_key`(`bioguideId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favoritedcongressmember` (
    `userId` VARCHAR(191) NOT NULL,
    `memberId` INTEGER NOT NULL,
    `favoritedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoritedCongressMember_memberId_idx`(`memberId`),
    INDEX `FavoritedCongressMember_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `memberId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NOT NULL,
    `chamber` ENUM('HOUSE', 'SENATE') NOT NULL,
    `rollNumber` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `question` TEXT NULL,
    `result` VARCHAR(191) NULL,
    `billNumber` VARCHAR(191) NULL,
    `name_id` VARCHAR(191) NULL,
    `totalYea` INTEGER NOT NULL,
    `totalNay` INTEGER NOT NULL,
    `totalNotVoting` INTEGER NOT NULL,
    `totalPresent` INTEGER NOT NULL DEFAULT 0,
    `totalVoting` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vote_congress_idx`(`congress`),
    INDEX `Vote_date_idx`(`date`),
    INDEX `Vote_name_id_idx`(`name_id`),
    UNIQUE INDEX `Vote_congress_chamber_rollNumber_key`(`congress`, `chamber`, `rollNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uservote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `votePosition` ENUM('YEA', 'NAY', 'PRESENT', 'NOT_VOTING') NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `legislationId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserVote_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `UserVote_legislationId_idx`(`legislationId`),
    INDEX `UserVote_userId_idx`(`userId`),
    UNIQUE INDEX `UserVote_userId_entityType_entityId_key`(`userId`, `entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membervote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voteId` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,
    `votePosition` ENUM('YEA', 'NAY', 'PRESENT', 'NOT_VOTING') NOT NULL,
    `party` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MemberVote_memberId_idx`(`memberId`),
    INDEX `MemberVote_voteId_idx`(`voteId`),
    UNIQUE INDEX `MemberVote_voteId_memberId_key`(`voteId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legislation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NULL,
    `introducedDate` DATETIME(3) NULL,
    `number` VARCHAR(191) NULL,
    `title` TEXT NULL,
    `type` VARCHAR(191) NULL,
    `url` VARCHAR(500) NULL,
    `amendmentNumber` VARCHAR(191) NULL,
    `policy_area_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name_id` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `ai_summary` TEXT NULL,
    `fine_print` TEXT NULL,
    `hidden_implications` TEXT NULL,
    `key_terms` TEXT NULL,
    `bill_size` VARCHAR(191) NULL,
    `word_count` INTEGER NULL,

    UNIQUE INDEX `Legislation_name_id_key`(`name_id`),
    INDEX `Legislation_policy_area_id_fkey`(`policy_area_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permission_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rolepermission` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    INDEX `rolepermission_roleId_idx`(`roleId`),
    INDEX `rolepermission_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legislationsponsor` (
    `legislationId` INTEGER NOT NULL,
    `sponsorBioguideId` VARCHAR(191) NOT NULL,

    INDEX `LegislationSponsor_sponsorBioguideId_idx`(`sponsorBioguideId`),
    PRIMARY KEY (`legislationId`, `sponsorBioguideId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legislationcosponsor` (
    `legislationId` INTEGER NOT NULL,
    `cosponsorBioguideId` VARCHAR(191) NOT NULL,

    INDEX `LegislationCosponsor_cosponsorBioguideId_idx`(`cosponsorBioguideId`),
    PRIMARY KEY (`legislationId`, `cosponsorBioguideId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `policyarea` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `latestaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action_date` DATETIME(3) NULL,
    `text` TEXT NULL,
    `legislation_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LatestAction_legislation_id_key`(`legislation_id`),
    INDEX `LatestAction_legislation_id_idx`(`legislation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `congressterm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chamber` VARCHAR(191) NULL,
    `startYear` INTEGER NULL,
    `endYear` INTEGER NULL,
    `memberId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CongressTerm_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partyhistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partyName` VARCHAR(191) NULL,
    `partyAbbreviation` VARCHAR(191) NULL,
    `startYear` INTEGER NULL,
    `memberId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartyHistory_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leadershipposition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `congress` INTEGER NULL,
    `type` VARCHAR(191) NULL,
    `memberId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeadershipPosition_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `depiction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NULL,
    `attribution` VARCHAR(191) NULL,
    `memberId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Depiction_memberId_key`(`memberId`),
    INDEX `Depiction_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authenticator` ADD CONSTRAINT `authenticator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `congresssession` ADD CONSTRAINT `congresssession_bioguideId_fkey` FOREIGN KEY (`bioguideId`) REFERENCES `congressmember`(`bioguideId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favoritedcongressmember` ADD CONSTRAINT `favoritedcongressmember_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `congressmember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favoritedcongressmember` ADD CONSTRAINT `favoritedcongressmember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rolepermission` ADD CONSTRAINT `rolepermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rolepermission` ADD CONSTRAINT `rolepermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

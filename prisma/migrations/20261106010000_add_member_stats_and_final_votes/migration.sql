-- AlterTable
ALTER TABLE `roll_call` ADD COLUMN `isFinalVote` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `member_stat` (
    `personId` INTEGER NOT NULL,
    `chamberKind` VARCHAR(16) NOT NULL,
    `totalVotes` INTEGER NOT NULL DEFAULT 0,
    `missedVotes` INTEGER NOT NULL DEFAULT 0,
    `attendancePercent` INTEGER NULL,
    `attendancePercentile` INTEGER NULL,
    `partyVotes` INTEGER NOT NULL DEFAULT 0,
    `partyLoyaltyPercent` INTEGER NULL,
    `loyaltyPercentile` INTEGER NULL,
    `sponsoredCount` INTEGER NOT NULL DEFAULT 0,
    `sponsoredThisCongress` INTEGER NOT NULL DEFAULT 0,
    `cosponsoredCount` INTEGER NOT NULL DEFAULT 0,
    `becameLawCount` INTEGER NOT NULL DEFAULT 0,
    `lawPercentile` INTEGER NULL,
    `lastVoteAt` DATETIME(3) NULL,
    `computedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`personId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_policy_stat` (
    `personId` INTEGER NOT NULL,
    `policyArea` VARCHAR(120) NOT NULL,
    `sponsoredCount` INTEGER NOT NULL DEFAULT 0,
    `becameLawCount` INTEGER NOT NULL DEFAULT 0,
    `yeaVotes` INTEGER NOT NULL DEFAULT 0,
    `nayVotes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`personId`, `policyArea`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `roll_call_billId_isFinalVote_idx` ON `roll_call`(`billId`, `isFinalVote`);

-- CreateIndex
CREATE INDEX `roll_call_isFinalVote_occurredAt_idx` ON `roll_call`(`isFinalVote`, `occurredAt`);

-- AddForeignKey
ALTER TABLE `member_stat` ADD CONSTRAINT `member_stat_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_policy_stat` ADD CONSTRAINT `member_policy_stat_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


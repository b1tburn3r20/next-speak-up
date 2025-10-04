-- CreateTable
CREATE TABLE `forumpost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `views` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `forumpost_authorId_idx`(`authorId`),
    INDEX `forumpost_type_idx`(`type`),
    INDEX `forumpost_createdAt_idx`(`createdAt`),
    INDEX `forumpost_views_idx`(`views`),
    INDEX `forumpost_isPinned_createdAt_idx`(`isPinned`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumcomment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `body` TEXT NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `postId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `depth` INTEGER NOT NULL DEFAULT 0,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `forumcomment_authorId_idx`(`authorId`),
    INDEX `forumcomment_postId_idx`(`postId`),
    INDEX `forumcomment_parentId_idx`(`parentId`),
    INDEX `forumcomment_postId_parentId_idx`(`postId`, `parentId`),
    INDEX `forumcomment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumtag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `forumtag_name_key`(`name`),
    INDEX `forumtag_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumposttag` (
    `postId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    INDEX `forumposttag_postId_idx`(`postId`),
    INDEX `forumposttag_tagId_idx`(`tagId`),
    PRIMARY KEY (`postId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumpostupvote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `postId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forumpostupvote_userId_idx`(`userId`),
    INDEX `forumpostupvote_postId_idx`(`postId`),
    UNIQUE INDEX `forumpostupvote_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumpostdownvote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `postId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forumpostdownvote_userId_idx`(`userId`),
    INDEX `forumpostdownvote_postId_idx`(`postId`),
    UNIQUE INDEX `forumpostdownvote_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumpostbookmark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `postId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forumpostbookmark_userId_idx`(`userId`),
    INDEX `forumpostbookmark_postId_idx`(`postId`),
    UNIQUE INDEX `forumpostbookmark_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumcommentupvote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `commentId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forumcommentupvote_userId_idx`(`userId`),
    INDEX `forumcommentupvote_commentId_idx`(`commentId`),
    UNIQUE INDEX `forumcommentupvote_userId_commentId_key`(`userId`, `commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forumcommentdownvote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `commentId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forumcommentdownvote_userId_idx`(`userId`),
    INDEX `forumcommentdownvote_commentId_idx`(`commentId`),
    UNIQUE INDEX `forumcommentdownvote_userId_commentId_key`(`userId`, `commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `forumpost` ADD CONSTRAINT `forumpost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcomment` ADD CONSTRAINT `forumcomment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcomment` ADD CONSTRAINT `forumcomment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `forumpost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcomment` ADD CONSTRAINT `forumcomment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `forumcomment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumposttag` ADD CONSTRAINT `forumposttag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `forumpost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumposttag` ADD CONSTRAINT `forumposttag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `forumtag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumpostupvote` ADD CONSTRAINT `forumpostupvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumpostupvote` ADD CONSTRAINT `forumpostupvote_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `forumpost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumpostdownvote` ADD CONSTRAINT `forumpostdownvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumpostdownvote` ADD CONSTRAINT `forumpostdownvote_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `forumpost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumpostbookmark` ADD CONSTRAINT `forumpostbookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumpostbookmark` ADD CONSTRAINT `forumpostbookmark_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `forumpost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcommentupvote` ADD CONSTRAINT `forumcommentupvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcommentupvote` ADD CONSTRAINT `forumcommentupvote_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `forumcomment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcommentdownvote` ADD CONSTRAINT `forumcommentdownvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forumcommentdownvote` ADD CONSTRAINT `forumcommentdownvote_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `forumcomment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `useraction` ADD COLUMN `entityId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `UserAction_entityId_idx` ON `useraction`(`entityId`);

-- CreateIndex
CREATE INDEX `UserAction_action_entityId_idx` ON `useraction`(`action`, `entityId`);

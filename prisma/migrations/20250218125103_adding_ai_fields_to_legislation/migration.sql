-- AlterTable
ALTER TABLE `legislation` ADD COLUMN `fine_print` TEXT NULL,
    ADD COLUMN `hidden_implications` TEXT NULL,
    ADD COLUMN `key_terms` TEXT NULL;

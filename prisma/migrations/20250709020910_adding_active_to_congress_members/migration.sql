/*
  Warnings:

  - Added the required column `active` to the `congressmember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `congressmember` ADD COLUMN `active` BOOLEAN NOT NULL;

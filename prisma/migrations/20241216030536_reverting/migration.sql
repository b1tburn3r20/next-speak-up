/*
  Warnings:

  - You are about to drop the `_cosponsoredcosponsors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cosponsoredlatestaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cosponsoredlegislation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_cosponsoredcosponsors` DROP FOREIGN KEY `_CosponsoredCosponsors_A_fkey`;

-- DropForeignKey
ALTER TABLE `_cosponsoredcosponsors` DROP FOREIGN KEY `_CosponsoredCosponsors_B_fkey`;

-- DropForeignKey
ALTER TABLE `cosponsoredlatestaction` DROP FOREIGN KEY `CosponsoredLatestAction_legislation_id_fkey`;

-- DropForeignKey
ALTER TABLE `cosponsoredlegislation` DROP FOREIGN KEY `CosponsoredLegislation_policy_area_id_fkey`;

-- DropForeignKey
ALTER TABLE `cosponsoredlegislation` DROP FOREIGN KEY `CosponsoredLegislation_primary_sponsor_id_fkey`;

-- DropTable
DROP TABLE `_cosponsoredcosponsors`;

-- DropTable
DROP TABLE `cosponsoredlatestaction`;

-- DropTable
DROP TABLE `cosponsoredlegislation`;

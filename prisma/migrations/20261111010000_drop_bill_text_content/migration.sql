-- Bill text is fetched from Congress.gov on request and cached, not stored.
-- DropForeignKey
ALTER TABLE `bill_text_content` DROP FOREIGN KEY `bill_text_content_billId_fkey`;

-- DropTable
DROP TABLE `bill_text_content`;


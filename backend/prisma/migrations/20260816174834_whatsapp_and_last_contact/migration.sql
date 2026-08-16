-- AlterTable
ALTER TABLE `activities` MODIFY `type` ENUM('CALL', 'WHATSAPP', 'MEETING', 'EMAIL_OUT', 'EMAIL_IN', 'NOTE', 'STAGE_CHANGE', 'SYSTEM') NOT NULL;

-- AlterTable
ALTER TABLE `companies` ADD COLUMN `lastContactedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `companies_lastContactedAt_idx` ON `companies`(`lastContactedAt`);

-- CreateIndex
CREATE INDEX `companies_lastContactedAt_id_idx` ON `companies`(`lastContactedAt`, `id`);

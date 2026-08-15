-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `role` ENUM('ADMIN', 'SALES', 'VIEWER') NOT NULL DEFAULT 'SALES',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `familyId` VARCHAR(36) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `replacedById` VARCHAR(36) NULL,
    `userAgent` VARCHAR(255) NULL,
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_familyId_idx`(`familyId`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity` VARCHAR(60) NULL,
    `entityId` VARCHAR(36) NULL,
    `meta` JSON NULL,
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(36) NOT NULL,
    `placeId` VARCHAR(191) NULL,
    `source` VARCHAR(24) NOT NULL DEFAULT 'manual',
    `name` VARCHAR(255) NOT NULL,
    `nameNormalized` VARCHAR(191) NOT NULL,
    `dedupeKey` VARCHAR(64) NULL,
    `categoryRaw` VARCHAR(160) NULL,
    `sector` VARCHAR(60) NULL,
    `address` VARCHAR(500) NULL,
    `street` VARCHAR(255) NULL,
    `city` VARCHAR(80) NULL,
    `district` VARCHAR(80) NULL,
    `neighborhood` VARCHAR(120) NULL,
    `postalCode` VARCHAR(20) NULL,
    `countryCode` VARCHAR(2) NULL,
    `lat` DECIMAL(10, 7) NULL,
    `lng` DECIMAL(10, 7) NULL,
    `phone` VARCHAR(40) NULL,
    `phoneE164` VARCHAR(20) NULL,
    `websiteUrl` VARCHAR(500) NULL,
    `websiteDomain` VARCHAR(191) NULL,
    `googleRating` DECIMAL(2, 1) NULL,
    `googleReviewsCount` INTEGER NULL,
    `googleUrl` VARCHAR(500) NULL,
    `businessStatus` VARCHAR(30) NULL,
    `websiteStatus` ENUM('NO_WEBSITE', 'SOCIAL_ONLY', 'BROKEN', 'OUTDATED', 'ACTIVE_WEAK', 'ACTIVE_GOOD', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `websiteScore` INTEGER NULL,
    `leadScore` INTEGER NOT NULL DEFAULT 0,
    `leadGrade` ENUM('VERY_HOT', 'HOT', 'WARM', 'LOW') NOT NULL DEFAULT 'LOW',
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastAnalyzedAt` DATETIME(3) NULL,
    `lastScoredAt` DATETIME(3) NULL,
    `raw` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_placeId_key`(`placeId`),
    UNIQUE INDEX `companies_dedupeKey_key`(`dedupeKey`),
    INDEX `companies_websiteStatus_leadScore_idx`(`websiteStatus`, `leadScore`),
    INDEX `companies_leadGrade_leadScore_idx`(`leadGrade`, `leadScore`),
    INDEX `companies_city_district_idx`(`city`, `district`),
    INDEX `companies_sector_idx`(`sector`),
    INDEX `companies_websiteDomain_idx`(`websiteDomain`),
    INDEX `companies_nameNormalized_idx`(`nameNormalized`),
    FULLTEXT INDEX `companies_name_address_idx`(`name`, `address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(160) NULL,
    `role` VARCHAR(120) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `source` VARCHAR(24) NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `confidence` ENUM('VERIFIED', 'GUESSED') NOT NULL DEFAULT 'GUESSED',
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `contacts_email_idx`(`email`),
    UNIQUE INDEX `contacts_companyId_email_key`(`companyId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `website_analyses` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NOT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `requestedUrl` VARCHAR(500) NOT NULL,
    `finalUrl` VARCHAR(500) NULL,
    `httpStatus` INTEGER NULL,
    `redirectChain` JSON NULL,
    `sslValid` BOOLEAN NULL,
    `sslExpiresAt` DATETIME(3) NULL,
    `httpsRedirect` BOOLEAN NULL,
    `ttfbMs` INTEGER NULL,
    `loadMs` INTEGER NULL,
    `hasTitle` BOOLEAN NULL,
    `title` VARCHAR(500) NULL,
    `hasMetaDesc` BOOLEAN NULL,
    `metaDesc` TEXT NULL,
    `hasViewport` BOOLEAN NULL,
    `hasCanonical` BOOLEAN NULL,
    `hasRobotsTxt` BOOLEAN NULL,
    `hasSitemap` BOOLEAN NULL,
    `isResponsive` BOOLEAN NULL,
    `cms` VARCHAR(60) NULL,
    `generator` VARCHAR(160) NULL,
    `techStack` JSON NULL,
    `contactSignals` JSON NULL,
    `websiteScore` INTEGER NULL,
    `websiteStatus` ENUM('NO_WEBSITE', 'SOCIAL_ONLY', 'BROKEN', 'OUTDATED', 'ACTIVE_WEAK', 'ACTIVE_GOOD', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `errorCode` VARCHAR(40) NULL,
    `raw` JSON NULL,

    INDEX `website_analyses_companyId_checkedAt_idx`(`companyId`, `checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_score_rules` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(60) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `weight` INTEGER NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lead_score_rules_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sector_mappings` (
    `id` VARCHAR(36) NOT NULL,
    `categoryRaw` VARCHAR(160) NOT NULL,
    `sector` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `sector_mappings_categoryRaw_key`(`categoryRaw`),
    INDEX `sector_mappings_sector_idx`(`sector`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pipelines` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pipeline_stages` (
    `id` VARCHAR(36) NOT NULL,
    `pipelineId` VARCHAR(36) NOT NULL,
    `key` VARCHAR(40) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sortOrder` INTEGER NOT NULL,
    `isWon` BOOLEAN NOT NULL DEFAULT false,
    `isLost` BOOLEAN NOT NULL DEFAULT false,
    `color` VARCHAR(9) NULL,

    INDEX `pipeline_stages_pipelineId_sortOrder_idx`(`pipelineId`, `sortOrder`),
    UNIQUE INDEX `pipeline_stages_pipelineId_key_key`(`pipelineId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NOT NULL,
    `pipelineId` VARCHAR(36) NOT NULL,
    `stageId` VARCHAR(36) NOT NULL,
    `ownerId` VARCHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `value` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'TRY',
    `stageEnteredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,
    `lostReason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leads_stageId_stageEnteredAt_idx`(`stageId`, `stageEnteredAt`),
    INDEX `leads_ownerId_idx`(`ownerId`),
    INDEX `leads_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NULL,
    `leadId` VARCHAR(36) NULL,
    `userId` VARCHAR(36) NULL,
    `type` ENUM('CALL', 'MEETING', 'EMAIL_OUT', 'EMAIL_IN', 'NOTE', 'STAGE_CHANGE', 'SYSTEM') NOT NULL,
    `subject` VARCHAR(255) NULL,
    `body` TEXT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_companyId_occurredAt_idx`(`companyId`, `occurredAt`),
    INDEX `activities_leadId_occurredAt_idx`(`leadId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notes` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NULL,
    `leadId` VARCHAR(36) NULL,
    `userId` VARCHAR(36) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notes_companyId_createdAt_idx`(`companyId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(36) NOT NULL,
    `slug` VARCHAR(60) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `color` VARCHAR(9) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_tags` (
    `companyId` VARCHAR(36) NOT NULL,
    `tagId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_tags_tagId_idx`(`tagId`),
    PRIMARY KEY (`companyId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_searches` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `params` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `saved_searches_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mail_accounts` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(120) NOT NULL,
    `smtpHost` VARCHAR(191) NOT NULL,
    `smtpPort` INTEGER NOT NULL,
    `smtpSecure` BOOLEAN NOT NULL DEFAULT true,
    `smtpUser` VARCHAR(191) NOT NULL,
    `imapHost` VARCHAR(191) NOT NULL,
    `imapPort` INTEGER NOT NULL,
    `imapSecure` BOOLEAN NOT NULL DEFAULT true,
    `imapUser` VARCHAR(191) NOT NULL,
    `secretEnc` BLOB NOT NULL,
    `dailySendLimit` INTEGER NOT NULL DEFAULT 50,
    `lastSyncAt` DATETIME(3) NULL,
    `lastSyncUid` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'unverified',
    `lastError` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mail_accounts_userId_email_key`(`userId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_threads` (
    `id` VARCHAR(36) NOT NULL,
    `companyId` VARCHAR(36) NULL,
    `contactId` VARCHAR(36) NULL,
    `mailAccountId` VARCHAR(36) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `messageIdRoot` VARCHAR(255) NOT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_threads_companyId_lastMessageAt_idx`(`companyId`, `lastMessageAt`),
    INDEX `email_threads_messageIdRoot_idx`(`messageIdRoot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_messages` (
    `id` VARCHAR(36) NOT NULL,
    `threadId` VARCHAR(36) NOT NULL,
    `mailAccountId` VARCHAR(36) NOT NULL,
    `contactId` VARCHAR(36) NULL,
    `direction` ENUM('OUTBOUND', 'INBOUND') NOT NULL,
    `messageId` VARCHAR(255) NOT NULL,
    `inReplyTo` VARCHAR(255) NULL,
    `fromAddr` VARCHAR(191) NOT NULL,
    `toAddrs` JSON NOT NULL,
    `ccAddrs` JSON NULL,
    `subject` VARCHAR(500) NOT NULL,
    `bodyText` TEXT NULL,
    `bodyHtml` LONGTEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `receivedAt` DATETIME(3) NULL,
    `imapUid` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'queued',
    `error` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_messages_threadId_createdAt_idx`(`threadId`, `createdAt`),
    UNIQUE INDEX `email_messages_mailAccountId_messageId_key`(`mailAccountId`, `messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `do_not_contact` (
    `id` VARCHAR(36) NOT NULL,
    `type` ENUM('EMAIL', 'DOMAIN', 'PHONE') NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `createdBy` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `do_not_contact_type_value_key`(`type`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inbound_leads` (
    `id` VARCHAR(36) NOT NULL,
    `source` VARCHAR(40) NOT NULL,
    `payload` JSON NOT NULL,
    `name` VARCHAR(160) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `message` TEXT NULL,
    `pageUrl` VARCHAR(500) NULL,
    `utm` JSON NULL,
    `visitorId` VARCHAR(64) NULL,
    `ipHash` VARCHAR(64) NULL,
    `status` ENUM('NEW', 'REVIEWED', 'CONVERTED', 'SPAM') NOT NULL DEFAULT 'NEW',
    `companyId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inbound_leads_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `inbound_leads_visitorId_idx`(`visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_events` (
    `id` VARCHAR(36) NOT NULL,
    `visitorId` VARCHAR(64) NOT NULL,
    `sessionId` VARCHAR(64) NULL,
    `type` VARCHAR(40) NOT NULL,
    `pageUrl` VARCHAR(500) NULL,
    `meta` JSON NULL,
    `ipHash` VARCHAR(64) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visitor_events_visitorId_occurredAt_idx`(`visitorId`, `occurredAt`),
    INDEX `visitor_events_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discovery_runs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `provider` VARCHAR(20) NOT NULL,
    `params` JSON NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `foundCount` INTEGER NOT NULL DEFAULT 0,
    `newCount` INTEGER NOT NULL DEFAULT 0,
    `dupCount` INTEGER NOT NULL DEFAULT 0,
    `apifyRunId` VARCHAR(60) NULL,
    `datasetId` VARCHAR(60) NULL,
    `costUsd` DECIMAL(8, 4) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `error` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `discovery_runs_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `website_analyses` ADD CONSTRAINT `website_analyses_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pipeline_stages` ADD CONSTRAINT `pipeline_stages_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `pipelines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `pipelines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `pipeline_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_tags` ADD CONSTRAINT `company_tags_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_tags` ADD CONSTRAINT `company_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mail_accounts` ADD CONSTRAINT `mail_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_threads` ADD CONSTRAINT `email_threads_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_threads` ADD CONSTRAINT `email_threads_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_threads` ADD CONSTRAINT `email_threads_mailAccountId_fkey` FOREIGN KEY (`mailAccountId`) REFERENCES `mail_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `email_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_mailAccountId_fkey` FOREIGN KEY (`mailAccountId`) REFERENCES `mail_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inbound_leads` ADD CONSTRAINT `inbound_leads_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discovery_runs` ADD CONSTRAINT `discovery_runs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

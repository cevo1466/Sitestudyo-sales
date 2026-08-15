-- CreateIndex
CREATE INDEX `companies_leadScore_id_idx` ON `companies`(`leadScore`, `id`);

-- CreateIndex
CREATE INDEX `companies_googleRating_id_idx` ON `companies`(`googleRating`, `id`);

-- CreateIndex
CREATE INDEX `companies_firstSeenAt_id_idx` ON `companies`(`firstSeenAt`, `id`);

-- CreateIndex
CREATE INDEX `companies_lastAnalyzedAt_id_idx` ON `companies`(`lastAnalyzedAt`, `id`);

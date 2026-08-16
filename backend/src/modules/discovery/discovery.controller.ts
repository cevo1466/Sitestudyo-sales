import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import {
  startRunSchema,
  importDatasetSchema,
  type StartRunBody,
  type ImportDatasetBody,
} from './discovery.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('runs')
  list() {
    return this.discovery.list();
  }

  /** Hangi arama x konum ciftleri daha once tarandi. */
  @Get('coverage')
  coverage() {
    return this.discovery.coverage();
  }

  /** Yeni tarama baslatir — KREDI HARCAR, bu yuzden yalnizca admin. */
  @Roles(UserRole.ADMIN)
  @Post('runs')
  start(
    @Body(new ZodValidationPipe(startRunSchema)) dto: StartRunBody,
    @CurrentUser() user: AuthUser,
  ) {
    return this.discovery.startRun(dto, user.id);
  }

  @Post('runs/:id/refresh')
  @HttpCode(200)
  refresh(@Param('id') id: string) {
    return this.discovery.refresh(id);
  }

  @Post('runs/:id/import')
  @HttpCode(200)
  importRun(@Param('id') id: string) {
    return this.discovery.importRun(id);
  }

  /** Var olan bir Apify sonuc kumesini aktarir — kredi harcamaz. */
  @Roles(UserRole.ADMIN)
  @Post('import-dataset')
  @HttpCode(200)
  importDataset(@Body(new ZodValidationPipe(importDatasetSchema)) dto: ImportDatasetBody) {
    return this.discovery.importDataset(dto.datasetId, {
      onlyWithoutWebsite: dto.onlyWithoutWebsite,
      account: dto.account,
    });
  }
}

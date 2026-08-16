import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { TasksService } from './tasks.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

const createSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(255),
    notes: z.string().trim().max(5000).optional(),
    dueAt: z.coerce.date(),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

const snoozeSchema = z.object({ dueAt: z.coerce.date() });

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  /** Bugun (ve gecmis) yapilacaklar. */
  @Get('agenda')
  agenda(@CurrentUser() user: AuthUser, @Query('days') days?: string) {
    return this.tasks.agenda(user.id, days ? Number(days) : 0);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('companyId') companyId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.tasks.list(user.id, { companyId, status });
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createSchema)) dto: z.infer<typeof createSchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.create(user.id, dto);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tasks.complete(user.id, id);
  }

  @Post(':id/snooze')
  @HttpCode(200)
  snooze(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(snoozeSchema)) dto: { dueAt: Date },
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasks.snooze(user.id, id, dto.dueAt);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tasks.cancel(user.id, id);
  }
}

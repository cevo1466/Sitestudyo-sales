import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { z } from 'zod';
import { ActivityService } from './activity.service';
import { createActivitySchema, listActivitySchema } from './activity.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivityService) {}

  // DELETE ucu BILEREK YOK: zaman tuneli denetim izidir. Silinebilseydi
  // "bunlara ne zaman yazmistik" sorusunun cevabi guvenilmez olurdu.

  @Get()
  list(@Query(new ZodValidationPipe(listActivitySchema)) q: z.infer<typeof listActivitySchema>) {
    return this.activities.list(q);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createActivitySchema)) dto: z.infer<typeof createActivitySchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activities.record({ ...dto, userId: user.id });
  }
}

import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import {
  promoteSchema,
  updateLeadSchema,
  moveSchema,
  closeSchema,
  listLeadSchema,
  type ListLeadQuery,
  type PromoteDto,
} from './lead.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listLeadSchema)) q: ListLeadQuery) {
    return this.leads.list(q);
  }

  /** TERFI: havuzdaki isletmeyi satis hunisine alir. */
  @Post()
  promote(
    @Body(new ZodValidationPipe(promoteSchema)) dto: PromoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.promote(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) dto: { title?: string; value?: number | null },
  ) {
    return this.leads.update(id, dto);
  }

  @Post(':id/move')
  @HttpCode(200)
  move(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveSchema)) dto: { stageId: string; note?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.move(id, dto.stageId, dto.note, user.id);
  }

  @Post(':id/close')
  @HttpCode(200)
  close(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(closeSchema)) dto: { won: boolean; lostReason?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.close(id, dto.won, dto.lostReason, user.id);
  }
}

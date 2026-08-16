import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import type { z } from 'zod';
import { NotesService } from './notes.service';
import { createNoteSchema, updateNoteSchema, listNoteSchema } from './activity.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listNoteSchema)) q: z.infer<typeof listNoteSchema>) {
    return this.notes.listBy(q);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createNoteSchema)) dto: z.infer<typeof createNoteSchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notes.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) dto: { body: string },
  ) {
    return this.notes.update(id, dto.body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.notes.remove(id);
  }
}

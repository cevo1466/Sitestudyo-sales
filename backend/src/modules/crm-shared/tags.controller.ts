import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { TagsService } from './tags.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Renk #RRGGBB biciminde olmali').optional(),
});

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  list() {
    return this.tags.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createTagSchema)) dto: { name: string; color?: string }) {
    return this.tags.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.tags.remove(id);
  }
}

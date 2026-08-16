import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { SavedSearchesService } from './saved-searches.service';
import { companyFilterSchema, type CompanyFilter } from './company-filter.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  // Kaydedilen filtre ileride oldugu gibi calistirilacak; bozuk bir filtreyi
  // simdi kabul etmek sorunu aylar sonraya ertelemek olur.
  params: companyFilterSchema,
});

@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly saved: SavedSearchesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.saved.list(user.id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createSchema)) dto: { name: string; params: CompanyFilter },
    @CurrentUser() user: AuthUser,
  ) {
    return this.saved.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    await this.saved.remove(user.id, id);
  }
}

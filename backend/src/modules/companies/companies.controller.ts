import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { CompaniesService } from './companies.service';
import {
  companyFilterSchema,
  listQuerySchema,
  type CompanyFilter,
  type ListQuery,
} from './company-filter.dto';
import { updateCompanySchema, type UpdateCompanyDto } from './update-company.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CompanyBulkService } from './company-bulk.service';
import { bulkSchema, type BulkDto } from './bulk.dto';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

const countSchema = z.object({ filter: companyFilterSchema.default({}) });

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companies: CompaniesService,
    private readonly bulkService: CompanyBulkService,
  ) {}

  @Get()
  list(@Query(new ZodValidationPipe(listQuerySchema)) q: ListQuery) {
    return this.companies.list(q);
  }

  /**
   * Toplu islemden ONCE "kac kayit etkilenecek" sorusuna KESIN cevap.
   *
   * Listenin approxTotal degeri imlecte tasindigi icin gezinme sirasinda
   * bayatlayabilir; bu uc her cagrida yeniden sayar.
   *
   * NOT: bu metot @Get(':id')'den ONCE tanimli olmali — aksi halde ileride
   * bir POST :id yolu eklendiginde "count" bir kimlik saniliyor olabilir.
   */
  @Post('count')
  @HttpCode(200)
  async count(@Body(new ZodValidationPipe(countSchema)) body: { filter: CompanyFilter }) {
    return { matched: await this.companies.count(body.filter) };
  }

  /**
   * Toplu islem ID degil FILTRE alir: 3.400 kaydi secince 3.400 kimlik
   * gondermek pratik degil ve imlecli listede istemci hepsini gormemistir.
   */
  @Post('bulk')
  @HttpCode(200)
  runBulk(
    @Body(new ZodValidationPipe(bulkSchema)) dto: BulkDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bulkService.run(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companies.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCompanySchema)) dto: UpdateCompanyDto,
  ) {
    return this.companies.update(id, dto);
  }
}

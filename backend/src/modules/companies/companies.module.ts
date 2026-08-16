import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyBulkService } from './company-bulk.service';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  // Toplu terfi LeadsService'i kullaniyor; terfi mantigi tek yerde kalsin
  // diye burada kopyalanmiyor.
  imports: [LeadsModule],
  controllers: [CompaniesController, SavedSearchesController],
  providers: [CompaniesService, CompanyBulkService, SavedSearchesService],
  exports: [CompaniesService, CompanyBulkService],
})
export class CompaniesModule {}

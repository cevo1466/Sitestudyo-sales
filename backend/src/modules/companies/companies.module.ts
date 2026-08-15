import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyBulkService } from './company-bulk.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyBulkService],
  exports: [CompaniesService, CompanyBulkService],
})
export class CompaniesModule {}

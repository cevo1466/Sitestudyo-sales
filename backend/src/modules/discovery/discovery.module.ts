import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { ImportService } from './import.service';
import { ApifyPlaceProvider } from './apify.provider';

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService, ImportService, ApifyPlaceProvider],
  exports: [DiscoveryService, ImportService],
})
export class DiscoveryModule {}

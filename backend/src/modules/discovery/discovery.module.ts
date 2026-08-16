import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { ImportService } from './import.service';
import { ApifyPlaceProvider } from './apify.provider';
import { AutoDiscoveryService } from './auto-discovery.service';

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService, ImportService, ApifyPlaceProvider, AutoDiscoveryService],
  exports: [DiscoveryService, ImportService, AutoDiscoveryService],
})
export class DiscoveryModule {}

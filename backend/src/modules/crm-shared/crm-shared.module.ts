import { Global, Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

/**
 * @Global: TagsService ve ActivityService'i neredeyse her CRM modulu
 * kullanacak. Her modulde tek tek import etmek yerine bir kez global.
 */
@Global()
@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class CrmSharedModule {}

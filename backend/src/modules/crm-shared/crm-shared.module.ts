import { Global, Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { ActivityService } from './activity.service';
import { ActivitiesController } from './activities.controller';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';

/**
 * @Global: ActivityService ve TagsService'i neredeyse her CRM modulu
 * kullanacak. Her modulde tek tek import etmek yerine bir kez global.
 */
@Global()
@Module({
  controllers: [TagsController, ActivitiesController, NotesController],
  providers: [TagsService, ActivityService, NotesService],
  exports: [TagsService, ActivityService, NotesService],
})
export class CrmSharedModule {}

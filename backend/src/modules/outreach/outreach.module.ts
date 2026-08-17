import { Module } from '@nestjs/common';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { ScoringModule } from '../scoring/scoring.module';
import { WorkQueueService } from './queue.service';

// ScoringModule: mesaj metnindeki {{skorGerekce}} degiskeni puanlama
// kirilimini kullaniyor. Kirilim veritabaninda saklanmiyor (yalniz skorun
// kendisi), o yuzden mesaj uretilirken yeniden hesaplaniyor.
@Module({
  imports: [ScoringModule],
  controllers: [OutreachController],
  providers: [OutreachService, WorkQueueService],
  exports: [OutreachService, WorkQueueService],
})
export class OutreachModule {}

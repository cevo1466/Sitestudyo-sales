import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { ImapSyncService } from './imap-sync.service';

@Module({
  controllers: [MailController],
  providers: [MailService, ImapSyncService],
  exports: [MailService, ImapSyncService],
})
export class MailModule {}

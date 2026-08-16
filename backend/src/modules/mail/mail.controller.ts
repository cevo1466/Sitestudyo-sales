import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { MailService } from './mail.service';
import { ImapSyncService } from './imap-sync.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

const accountSchema = z.object({
  email: z.string().email().max(191),
  displayName: z.string().trim().min(1).max(120),
  smtpHost: z.string().trim().min(3).max(191),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecure: z.boolean().default(true),
  smtpUser: z.string().trim().min(1).max(191),
  smtpPassword: z.string().min(1).max(400),
  imapHost: z.string().trim().min(3).max(191),
  imapPort: z.number().int().min(1).max(65535),
  imapSecure: z.boolean().default(true),
  imapUser: z.string().trim().min(1).max(191),
  imapPassword: z.string().min(1).max(400),
  dailySendLimit: z.number().int().min(1).max(500).optional(),
});

const sendSchema = z.object({
  accountId: z.string().uuid(),
  companyId: z.string().uuid(),
  contactId: z.string().uuid(),
  subject: z.string().trim().min(1).max(300),
  html: z.string().min(1).max(100_000),
});

@Controller()
export class MailController {
  constructor(
    private readonly mail: MailService,
    private readonly imap: ImapSyncService,
  ) {}

  @Get('mail/accounts')
  accounts(@CurrentUser() user: AuthUser) {
    return this.mail.listAccounts(user.id);
  }

  @Post('mail/accounts')
  add(
    @Body(new ZodValidationPipe(accountSchema)) dto: z.infer<typeof accountSchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mail.addAccount(user.id, dto);
  }

  @Post('mail/accounts/:id/test')
  @HttpCode(200)
  test(@Param('id') id: string) {
    return this.mail.testAccount(id);
  }

  @Post('email/send')
  @HttpCode(200)
  send(
    @Body(new ZodValidationPipe(sendSchema)) dto: z.infer<typeof sendSchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mail.send(user.id, dto);
  }

  @Get('email/threads')
  threads(@Query('companyId') companyId: string) {
    return this.mail.listThreads(companyId);
  }

  @Post('email/sync')
  @HttpCode(200)
  sync(@Body(new ZodValidationPipe(z.object({ accountId: z.string().uuid() }))) b: { accountId: string }) {
    return this.imap.sync(b.accountId);
  }
}

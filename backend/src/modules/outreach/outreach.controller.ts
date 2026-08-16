import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { OutreachService } from './outreach.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/public.decorator';

const logSchema = z.object({
  templateKey: z.string().trim().min(1).max(60),
  text: z.string().trim().min(1).max(4000),
});

const blockSchema = z.object({ reason: z.string().trim().max(255).optional() });

const templatesSchema = z.object({
  templates: z
    .array(
      z.object({
        key: z.string().trim().regex(/^[a-z0-9_]{1,40}$/, 'key küçük harf ve alt çizgi olmalı'),
        label: z.string().trim().min(1).max(60),
        body: z.string().trim().min(10).max(2000),
      }),
    )
    .min(1)
    .max(10),
});

@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreach: OutreachService) {}

  @Get('templates')
  templates() {
    return this.outreach.listTemplates();
  }

  @Roles(UserRole.ADMIN)
  @Put('templates')
  saveTemplates(@Body(new ZodValidationPipe(templatesSchema)) b: { templates: never[] }) {
    return this.outreach.saveTemplates(b.templates);
  }

  /** Bu işletmeye gönderilebilecek hazır mesajlar + WhatsApp bağlantıları. */
  @Get('company/:id/messages')
  messages(@Param('id') id: string) {
    return this.outreach.messagesFor(id);
  }

  @Post('company/:id/whatsapp-sent')
  @HttpCode(201)
  logSent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(logSchema)) b: { templateKey: string; text: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.outreach.logWhatsApp(id, user.id, b.templateKey, b.text);
  }

  @Post('company/:id/block')
  @HttpCode(200)
  block(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(blockSchema)) b: { reason?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.outreach.blockPhone(id, user.id, b.reason ?? null);
  }
}

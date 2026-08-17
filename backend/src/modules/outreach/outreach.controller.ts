import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { OutreachService } from './outreach.service';
import { TEMPLATE_VARIABLES } from './personalize';
import { QUEUE_MAX, WorkQueueService } from './queue.service';
import { companyFilterSchema, type CompanyFilter } from '../companies/company-filter.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/public.decorator';

const logSchema = z.object({
  templateKey: z.string().trim().min(1).max(60),
  text: z.string().trim().min(1).max(4000),
  /**
   * 'opened' = WhatsApp penceresi gercekten acildi (arayuz bunu ancak
   * acma basariliysa gonderir). 'sent' = kullanici "Gonderdim" dedi.
   * Varsayilan 'opened': eski surumdeki masaustu uygulamalari bu alani
   * hic gondermiyor ve onlarin kaydi da kaybolmamali.
   */
  outcome: z.enum(['opened', 'sent']).default('opened'),
});

const blockSchema = z.object({ reason: z.string().trim().max(255).optional() });

/**
 * Kuyruk sorgusu: limit + isletme filtresinin tamami.
 *
 * Filtre semasi TEKRAR YAZILMIYOR, `companyFilterSchema` yeniden
 * kullaniliyor — kuyruk ile liste ekrani ayni filtreyi anlamak zorunda,
 * yoksa "listede 40 kayit var ama kuyruk 12 gosteriyor" durumu olusur.
 */
const queueQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(QUEUE_MAX).default(20) })
  .passthrough()
  .transform((raw, ctx) => {
    const { limit, ...rest } = raw as Record<string, unknown> & { limit: number };
    const parsed = companyFilterSchema.safeParse(rest);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) ctx.addIssue(issue);
      return z.NEVER;
    }
    return { filter: parsed.data as Partial<CompanyFilter>, limit };
  });

type QueueQuery = { filter: Partial<CompanyFilter>; limit: number };

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
  constructor(
    private readonly outreach: OutreachService,
    private readonly queue: WorkQueueService,
  ) {}

  /**
   * Calisma kuyrugu: bugun konusulacaklar + HAZIR metinleri.
   *
   * Varsayilan filtre cep telefonu olan, sicak/cok sicak ve bugun temas
   * edilmemis isletmeler; skora gore azalan. Cagiran kendi filtresini
   * verirse (Isletmeler ekranindaki "kuyruk hazirla") varsayilani ezer.
   *
   * Tek uc: metinsiz hafif bir liste + metinli ikinci bir uc denendi ama
   * arayuz her zaman metni de istiyor — ikinci uc kullanilmayan kod
   * olarak kalirdi.
   */
  @Get('queue')
  workQueue(@Query(new ZodValidationPipe(queueQuerySchema)) q: QueueQuery) {
    return this.queue.prepare(q.filter, q.limit);
  }

  @Get('templates')
  templates() {
    return this.outreach.listTemplates();
  }

  /**
   * Sablonda kullanilabilecek degiskenler.
   *
   * Ayarlar ekranindaki cipler bunu cekiyor. Liste onceden masaustunde de
   * ayri yazilmisti; motora yeni degisken eklendiginde arayuz bilmiyordu.
   */
  @Get('template-variables')
  templateVariables() {
    return TEMPLATE_VARIABLES;
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
    @Body(new ZodValidationPipe(logSchema))
    b: { templateKey: string; text: string; outcome: 'opened' | 'sent' },
    @CurrentUser() user: AuthUser,
  ) {
    return this.outreach.logWhatsApp(id, user.id, b.templateKey, b.text, b.outcome);
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

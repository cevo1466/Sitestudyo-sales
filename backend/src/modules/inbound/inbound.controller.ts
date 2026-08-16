import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { InboundStatus } from '@prisma/client';
import { z } from 'zod';
import { InboundService } from './inbound.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CryptoService } from '../../common/services/crypto.service';
import { clientIp, type IpBearingRequest } from '../../common/http/client-ip';

/** HMAC dogrulamasi ham govdeye bagli; `rawBody` bu yuzden sekilde. */
type InboundRequest = IpBearingRequest & { rawBody?: Buffer; body?: unknown };

/** Baslik degerini metin olarak okur (Fastify tekrar eden basligi dizi verir). */
function header(req: InboundRequest, name: string): string | undefined {
  const raw = req.headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value : undefined;
}

const inboundSchema = z
  .object({
    source: z.enum(['contact_form', 'price_calculator', 'callback']),
    name: z.string().trim().max(160).optional(),
    email: z.string().email().max(191).optional(),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().max(5000).optional(),
    pageUrl: z.string().url().max(500).optional(),
    utm: z.record(z.string().max(200)).optional(),
    visitorId: z.string().max(64).optional(),
  })
  // Ne e-posta ne telefon varsa geri donulemez; kayit ise yaramaz.
  .refine((d) => Boolean(d.email || d.phone), {
    message: 'E-posta veya telefon zorunlu',
    path: ['email'],
  });

const eventSchema = z.object({
  visitorId: z.string().min(8).max(64),
  sessionId: z.string().max(64).optional(),
  type: z.enum(['page_view', 'portfolio_view', 'price_calc', 'cta_click']),
  pageUrl: z.string().url().max(500).optional(),
  meta: z.record(z.unknown()).optional(),
});

@Controller()
export class InboundController {
  constructor(
    private readonly inbound: InboundService,
    private readonly crypto: CryptoService,
  ) {}

  @Public()
  @Post('inbound-leads')
  @HttpCode(201)
  receive(@Body(new ZodValidationPipe(inboundSchema)) dto: z.infer<typeof inboundSchema>, @Req() req: InboundRequest) {
    this.verify(req);
    return this.inbound.receive(dto, clientIp(req));
  }

  @Public()
  @Post('events')
  @HttpCode(202)
  event(@Body(new ZodValidationPipe(eventSchema)) dto: z.infer<typeof eventSchema>, @Req() req: InboundRequest) {
    this.verify(req);
    return this.inbound.recordEvent(dto, clientIp(req));
  }

  @Get('inbound-leads')
  list(@Query('status') status?: InboundStatus) {
    return this.inbound.list(status);
  }

  @Get('inbound-leads/:id/journey')
  journey(@Param('id') id: string) {
    return this.inbound.journey(id);
  }

  @Post('inbound-leads/:id/convert')
  @HttpCode(200)
  convert(@Param('id') id: string) {
    return this.inbound.convert(id);
  }

  /**
   * HMAC dogrulamasi.
   *
   * Bu uclar internete acik; imzasiz birakilsaydi herkes havuza sahte
   * lead basabilir, gelen kutusunu kullanilamaz hale getirebilirdi.
   */
  private verify(req: InboundRequest): void {
    const ts = header(req, 'x-inbound-timestamp');
    const sig = header(req, 'x-inbound-signature');

    // YALNIZCA ham govde. Yeniden serilestirilmis JSON'a dusmek, bicim
    // farklarinda (bosluk, anahtar sirasi) imzayi sessizce gecersiz kilar —
    // ve daha kotusu, bazi istemcilerde tesadufen tutup bazilarinda
    // tutmayan bir dogrulama uretir. Ham govde yoksa reddediyoruz.
    const body = req.rawBody?.toString('utf8');
    if (!body || !ts || !sig || !this.crypto.verifyInboundSignature(body, ts, sig)) {
      throw new UnauthorizedException({
        code: 'invalid_signature',
        message: 'Istek imzasi gecersiz',
      });
    }
  }
}

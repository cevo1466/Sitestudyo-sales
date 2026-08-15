import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Masaustu istemcisinin "Baglantiyi Test Et" dugmesi buraya vurur.
 *
 * Bilerek kimlik dogrulamasiz: kullanici HENUZ giris yapamiyor, once dogru
 * sunucuya baktigini gormesi gerekiyor. Bu yuzden cevap sadece "ayaktayim"
 * bilgisini ve kullanicinin dogru VDS'e baglandigini anlayacagi adi icerir —
 * surum/veritabani ayrintisi disari verilmez.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  async check() {
    const dbOk = await this.prisma.ping();
    return {
      status: dbOk ? 'ok' : 'degraded',
      serverName: this.config.get<string>('SERVER_NAME'),
      api: 'v1',
      time: new Date().toISOString(),
    };
  }
}

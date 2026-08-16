import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { AppModule } from './app.module';
import { corsOrigins, validateEnv } from './config/env';
import { clientIp } from './common/http/client-ip';

/**
 * Tek imaj, iki rol.
 *   ROLE=api    -> HTTP sunucusu
 *   ROLE=worker -> HTTP yok, sadece BullMQ kuyrugu (Faz 4'ten itibaren)
 * Ayni kod tabani ve ayni bagimliliklar; iki ayri imaj bakim yuku olurdu.
 */
async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env as Record<string, unknown>);
  const logger = new Logger('Bootstrap');

  if (env.ROLE === 'worker') {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: env.NODE_ENV === 'production' ? ['log', 'warn', 'error'] : undefined,
    });
    app.enableShutdownHooks();
    logger.log('Isci modunda baslatildi (HTTP sunucusu acilmadi)');
    return;
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // trustProxy: istekler Cloudflare -> hosting_nginx -> buraya geliyor.
    // Kapali olsa her istegin kaynagi nginx konteyneri gorunur ve
    // oran sinirlama tek bir sayaca duserdi.
    new FastifyAdapter({ trustProxy: true, bodyLimit: 2 * 1024 * 1024 }),
    {
      logger: env.NODE_ENV === 'production' ? ['log', 'warn', 'error'] : undefined,
      // Nest'in kendi JSON ayristiricisi KAPALI: asagida ham govdeyi de
      // saklayan kendi ayristiricimizi kuruyoruz. Ikisi ayni anda
      // kayitli olamiyor (Fastify 'already present' hatasi veriyor).
      bodyParser: false,
    },
  );

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  /**
   * HAM govdeyi sakla — HMAC dogrulamasi icin zorunlu.
   *
   * Imza, istemcinin gonderdigi baytlar uzerinden hesaplanir. Sunucu
   * govdeyi ayristirip YENIDEN serilestirirse en ufak bicim farki
   * (iki nokta ustustenden sonra bosluk, anahtar sirasi, unicode kacisi)
   * imzayi bozar. Python'un json.dumps'i varsayilan olarak bosluk koyuyor,
   * JSON.stringify koymuyor: ayni veri, farkli bayt, gecersiz imza.
   */
  app
    .getHttpAdapter()
    .getInstance()
    .addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (req, body: Buffer, done) => {
        (req as unknown as { rawBody: Buffer }).rawBody = body;
        if (!body.length) return done(null, {});
        try {
          done(null, JSON.parse(body.toString('utf8')));
        } catch {
          done(new Error('Govde gecerli JSON degil'));
        }
      },
    );

  await app.register(helmet, {
    // Bu bir JSON API'si; tarayicida sayfa sunmuyoruz.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  });

  await app.register(cors, {
    origin: corsOrigins(env),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_GLOBAL_PER_MIN,
    timeWindow: '1 minute',
    keyGenerator: (req) => clientIp(req as never) ?? 'bilinmeyen',
    // Giris denemeleri cok daha sikidir; /auth/login icin ayri sinir.
    allowList: [],
  });

  // Giris ucu: kaba kuvvete karsi IP basina dakikada N deneme.
  app.getHttpAdapter().getInstance().register(
    async (instance) => {
      await instance.register(rateLimit, {
        max: env.RATE_LIMIT_LOGIN_PER_MIN,
        timeWindow: '1 minute',
        keyGenerator: (req) => `login:${clientIp(req as never) ?? 'bilinmeyen'}`,
      });
    },
    { prefix: '/api/v1/auth/login' },
  );

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`API hazir: http://0.0.0.0:${env.PORT}/api/v1  (ortam: ${env.NODE_ENV})`);
}

void bootstrap();

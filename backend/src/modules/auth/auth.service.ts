import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import type { AuthResponse, TokenPair } from './dto/auth.dto';

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

/**
 * argon2id parametreleri: bu VDS'te 3.9 GB RAM var ve baska servisler de
 * calisiyor. 19 MiB bellek maliyeti, giris hizini bozmadan kaba kuvvet
 * saldirisini pahali kilar. Daha yukarisi es zamanli girislerde swap'e iter.
 */
const ARGON_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
  ) {}

  static hashPassword(password: string): Promise<string> {
    return argon2.hash(password, ARGON_OPTS);
  }

  async login(email: string, password: string, meta: RequestMeta): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Kullanici yoksa da dogrulama yapiyoruz: aksi halde cevap suresi
    // "bu e-posta kayitli mi" sorusunu ele verir (kullanici numaralandirma).
    const ok = user
      ? await argon2.verify(user.passwordHash, password).catch(() => false)
      : await argon2
          .verify(
            '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000',
            password,
          )
          .catch(() => false);

    if (!user || !ok) {
      throw new UnauthorizedException({
        code: 'invalid_credentials',
        message: 'E-posta veya sifre hatali',
      });
    }
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'account_disabled',
        message: 'Hesabiniz devre disi birakilmis',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(
      { id: user.id, email: user.email, role: user.role },
      randomUUID(),
      meta,
    );

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  /**
   * Rotasyon + yeniden kullanim tespiti.
   *
   * Her refresh eski token'i kapatir ve yenisini verir. Kapanmis bir token
   * tekrar gelirse tek acikalama vardir: birisi onu kopyalamis. O anda
   * ailenin TAMAMI iptal edilir — hem saldirgan hem gercek kullanici duser,
   * gercek kullanici yeniden giris yapar. Sessizce devam etmekten iyidir.
   */
  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const tokenHash = this.crypto.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException({
        code: 'invalid_refresh_token',
        message: 'Oturum gecersiz, tekrar giris yapin',
      });
    }

    if (stored.revokedAt) {
      this.logger.warn(
        `Iptal edilmis refresh token yeniden kullanildi (aile: ${stored.familyId}) — aile kapatiliyor`,
      );
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException({
        code: 'token_reuse_detected',
        message: 'Guvenlik nedeniyle oturumunuz kapatildi, tekrar giris yapin',
      });
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'refresh_token_expired',
        message: 'Oturum suresi doldu, tekrar giris yapin',
      });
    }

    if (!stored.user.isActive) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException({
        code: 'account_disabled',
        message: 'Hesabiniz devre disi birakilmis',
      });
    }

    const next = await this.issueTokens(
      { id: stored.user.id, email: stored.user.email, role: stored.user.role },
      stored.familyId,
      meta,
    );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedById: this.crypto.hashToken(next.refreshToken).slice(0, 36),
      },
    });

    return next;
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.crypto.hashToken(refreshToken) },
    });
    // Bilinmeyen token'da da sessizce basarili donuyoruz: cikis yapmak
    // isteyen birine hata gostermenin faydasi yok.
    if (stored) await this.revokeFamily(stored.familyId);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'user_not_found', message: 'Kullanici bulunamadi' });
    }
    return user;
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    user: { id: string; email: string; role: string },
    familyId: string,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    // "15m" gibi bir metin yerine saniye veriyoruz: jsonwebtoken'in metin
    // bicimi dar bir sablon tipi bekliyor ve ".env"den gelen deger orada
    // dogrulanamiyor. Saniye her zaman gecerli, ayrica expiresIn cevabinda
    // zaten saniye donduruyoruz — tek kaynaktan hesaplanmasi daha guvenli.
    const accessTtlSeconds = Math.floor(
      parseTtlMs(this.config.getOrThrow<string>('JWT_ACCESS_TTL')) / 1000,
    );
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, typ: 'access' },
      { secret: this.config.getOrThrow<string>('JWT_SECRET'), expiresIn: accessTtlSeconds },
    );

    // Refresh token imzali JWT degil, sadece rastgele bir sir: dogrulamasi
    // veritabanindan yapiliyor, boylece anlik iptal edilebiliyor. JWT olsaydi
    // imzasi gecerli oldugu surece iptal etmenin yolu olmazdi.
    const refreshToken = randomBytes(48).toString('base64url');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.crypto.hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + parseTtlMs(this.config.getOrThrow('JWT_REFRESH_TTL'))),
        userAgent: meta.userAgent?.slice(0, 255) ?? null,
        ipHash: this.crypto.hashIp(meta.ip),
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtlSeconds };
  }
}

/** "15m" | "30d" | "3600" -> milisaniye */
export function parseTtlMs(ttl: string): number {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) throw new Error(`Gecersiz TTL bicimi: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return value * factor;
}

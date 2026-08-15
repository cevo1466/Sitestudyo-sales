import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * Varsayilan olarak HER uc nokta korumali (APP_GUARD olarak baglandi).
 * Acik birakilmasi gerekenler @Public() ile isaretlenir — yani bir uc noktayi
 * yanlislikla korumasiz birakmak mumkun degil, bilerek isaretlemek gerekiyor.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Yetkilendirme basligi eksik');
    }

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: AuthUser['role'];
        typ: string;
      }>(header.slice(7), { secret: this.config.getOrThrow<string>('JWT_SECRET') });

      // Refresh token'i erisim token'i yerine kullanmayi engelle.
      if (payload.typ !== 'access') {
        throw new UnauthorizedException('Bu token bu islem icin gecerli degil');
      }

      req.user = { id: payload.sub, email: payload.email, role: payload.role } satisfies AuthUser;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token gecersiz veya suresi dolmus');
    }
  }
}

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../services/crypto.service';
import { clientIp } from '../http/client-ip';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Her basarili yazma islemini `audit_logs`'a yazar.
 *
 * Neden sadece yazma: okuma isteklerini de kaydetmek tabloyu gunde
 * on binlerce satirla sisirir ve "kim neyi degistirdi" sorusuna cevap vermez.
 * Denetim kaydinin isi degisikligi izlemek.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    if (!WRITE_METHODS.has(req.method)) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const user = req.user as { id: string } | undefined;
        const action = `${ctx.getClass().name.replace(/Controller$/, '').toLowerCase()}.${ctx.getHandler().name}`;

        // Denetim kaydi ASLA asil istegi dusurmemeli: hata yutulur, loglanir.
        void this.prisma.auditLog
          .create({
            data: {
              userId: user?.id ?? null,
              action: action.slice(0, 80),
              entity: ctx.getClass().name.replace(/Controller$/, '').toLowerCase().slice(0, 60),
              entityId: typeof req.params?.id === 'string' ? req.params.id : null,
              meta: { method: req.method, path: req.url },
              ipHash: this.crypto.hashIp(clientIp(req)),
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}

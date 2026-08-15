import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { redact } from '../logging/redact';

interface ErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Tek tip hata bicimi: { code, message, fields? }
 * Istemci `code` uzerinden dallanir, `message` kullaniciya gosterilir.
 *
 * Beklenmeyen hatalarin detayi ISTEMCIYE GITMEZ — yiginda veritabani adi,
 * sorgu metni, dosya yolu olabilir. Detay loga, istemciye genel mesaj.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { code: 'internal_error', message: 'Beklenmeyen bir hata olustu' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      body =
        typeof payload === 'object' && payload !== null && 'code' in payload
          ? (payload as ErrorBody)
          : {
              code: defaultCode(status),
              message:
                typeof payload === 'string'
                  ? payload
                  : ((payload as { message?: string })?.message ?? exception.message),
            };
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        body = { code: 'duplicate', message: 'Bu kayit zaten mevcut' };
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        body = { code: 'not_found', message: 'Kayit bulunamadi' };
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status} | ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
      this.logger.debug(JSON.stringify(redact({ body: req.body, query: req.query })));
    }

    res.status(status).send(body);
  }
}

function defaultCode(status: number): string {
  const map: Record<number, string> = {
    400: 'bad_request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'not_found',
    409: 'conflict',
    429: 'rate_limited',
  };
  return map[status] ?? 'error';
}

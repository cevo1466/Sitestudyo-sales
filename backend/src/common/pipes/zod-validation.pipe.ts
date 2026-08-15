import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType, ZodTypeDef } from 'zod';

/**
 * Kullanim:  @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto
 *
 * Hata bicimi istemcinin alan bazli hata gosterebilmesi icin duz bir
 * { alan: mesaj } haritasi.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  /**
   * Girdi tipi `unknown`: sema donusturuyor olabilir (ornegin sorgu dizesinden
   * gelen "true" metnini boolean'a, duz alanlari ic ice filtre nesnesine).
   * `ZodSchema<T>` girdiyle cikti tipinin AYNI olmasini sart kosuyor ve
   * donusturen semalari reddediyor.
   */
  constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || '_';
        if (!fields[path]) fields[path] = issue.message;
      }
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Gonderilen veri gecersiz',
        fields,
      });
    }
    return result.data;
  }
}

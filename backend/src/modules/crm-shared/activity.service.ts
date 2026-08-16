import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface RecordActivityInput {
  type: ActivityType;
  companyId?: string | null;
  leadId?: string | null;
  userId?: string | null;
  subject?: string | null;
  body?: string | null;
  meta?: Prisma.InputJsonValue;
  occurredAt?: Date;
}

/**
 * ZAMAN TUNELININ TEK YAZMA KAPISI.
 *
 * Baska hicbir yer prisma.activity.create cagirmaz. Her servis kendi kaydini
 * atsaydi bir olayin yazilmayi unutulmasi kacinilmaz olurdu ve eksiklik
 * ancak birine "biz bunlara ne zaman yazmistik?" diye soruldugunda
 * anlasilirdi — yani zaman tunelinin guvenilmez oldugu anlasildiginda.
 */
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param tx Cagiran bir transaction icindeyse onu ver. Terfi gibi
   *   islemlerde lead ile aktivitenin AYNI transaction'da yazilmasi sart:
   *   biri yazilip digeri yazilmazsa gecmis eksik kalir.
   */
  record(input: RecordActivityInput, tx?: Prisma.TransactionClient) {
    if (!input.companyId && !input.leadId) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Aktivite bir isletmeye veya is kaydina bagli olmali',
      });
    }
    const client = tx ?? this.prisma;
    return client.activity.create({
      data: {
        type: input.type,
        companyId: input.companyId ?? null,
        leadId: input.leadId ?? null,
        userId: input.userId ?? null,
        subject: input.subject ?? null,
        body: input.body ?? null,
        meta: input.meta ?? Prisma.JsonNull,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  }

  async list(q: { companyId?: string; leadId?: string; limit: number; offset: number }) {
    const where = q.companyId ? { companyId: q.companyId } : { leadId: q.leadId };
    // Zaman tuneli tek bir kaydin gecmisi; derin sayfalama olmadigi icin
    // burada imlece gerek yok, offset yeterli.
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: q.limit,
        skip: q.offset,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { items, total };
  }
}

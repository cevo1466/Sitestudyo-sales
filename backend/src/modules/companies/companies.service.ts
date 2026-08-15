import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanyQuery, InvalidCursorError } from './company-query';
import type { CompanyFilter, ListQuery } from './company-filter.dto';
import type { UpdateCompanyDto } from './update-company.dto';
import { normalizeName } from './normalize-name';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListQuery) {
    const filterWhere = CompanyQuery.toWhere(q.filter);

    let total: number;
    let where = filterWhere;

    if (q.cursor) {
      let cursor;
      try {
        cursor = CompanyQuery.decodeCursor(q.cursor, q.sort);
      } catch (err) {
        if (err instanceof InvalidCursorError) {
          throw new BadRequestException({ code: 'invalid_cursor', message: err.message });
        }
        throw err;
      }
      // Toplam sayiyi imlecten okuyoruz: her sayfada COUNT(*) calistirmak
      // 20 sayfalik bir gezinmede 20 tam tarama demek olurdu.
      total = cursor.t;
      where = { AND: [filterWhere, CompanyQuery.cursorWhere(cursor, q.sort)] };
    } else {
      total = await this.prisma.company.count({ where: filterWhere });
    }

    // limit+1 cekiyoruz: fazladan kayit gelirse sonraki sayfa VAR demektir.
    // Ayri bir "daha var mi" sorgusu calistirmaya gerek kalmiyor.
    const rows = await this.prisma.company.findMany({
      where,
      orderBy: CompanyQuery.toOrderBy(q.sort),
      take: q.limit + 1,
    });

    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasMore && last
          ? CompanyQuery.encodeCursor(last as unknown as { id: string }, q.sort, total)
          : null,
      approxTotal: total,
    };
  }

  count(filter: CompanyFilter): Promise<number> {
    return this.prisma.company.count({ where: CompanyQuery.toWhere(filter) });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        analyses: { orderBy: { checkedAt: 'desc' }, take: 1 },
        leads: { where: { closedAt: null }, include: { stage: true } },
        tags: { include: { tag: true } },
        activities: { orderBy: { occurredAt: 'desc' }, take: 50 },
      },
    });
    if (!company) {
      throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id); // yoksa 404
    return this.prisma.company.update({
      where: { id },
      data: {
        ...dto,
        // Mukerrer tespiti nameNormalized uzerinden yuruyor; ad degisince
        // birlikte tazelenmezse bayat kalir ve ayni isletme iki kez girer.
        ...(dto.name ? { nameNormalized: normalizeName(dto.name) } : {}),
      },
    });
  }
}

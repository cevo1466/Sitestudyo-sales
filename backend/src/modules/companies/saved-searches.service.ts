import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CompanyFilter } from './company-filter.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: { name: string; params: CompanyFilter }) {
    // (userId, name) benzersizligi semada -> P2002 -> 409 duplicate
    return this.prisma.savedSearch.create({
      data: { userId, name: dto.name, params: dto.params as Prisma.InputJsonValue },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    // where'e userId dahil: baskasinin kaydini silmeye calisan 404 alir,
    // "var ama senin degil" bilgisi bile sizmaz.
    const res = await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    if (res.count === 0) {
      throw new NotFoundException({ code: 'not_found', message: 'Kayitli arama bulunamadi' });
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Notlar aktivitelerden AYRI: aktivite denetim izidir (silinemez), not
 * kullanicinin kendi calisma metnidir (duzenlenebilir, silinebilir).
 */
@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  listBy(q: { companyId?: string; leadId?: string }) {
    return this.prisma.note.findMany({
      where: q.companyId ? { companyId: q.companyId } : { leadId: q.leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: { companyId?: string; leadId?: string; body: string }, userId: string) {
    return this.prisma.note.create({
      data: {
        companyId: dto.companyId ?? null,
        leadId: dto.leadId ?? null,
        body: dto.body,
        userId,
      },
    });
  }

  async update(id: string, body: string) {
    await this.getOrThrow(id);
    return this.prisma.note.update({ where: { id }, data: { body } });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.note.delete({ where: { id } });
  }

  private async getOrThrow(id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException({ code: 'not_found', message: 'Not bulunamadi' });
    return note;
  }
}

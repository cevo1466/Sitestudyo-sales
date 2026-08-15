import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CreateContactDto, UpdateContactDto } from './contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  listByCompany(companyId: string) {
    // Birincil kisi basta: arayuz "kime yazacagiz" sorusuna ilk satirdan
    // cevap versin.
    return this.prisma.contact.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateContactDto) {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) {
      throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
    }
    // (companyId, email) benzersizligi semada tanimli -> P2002 -> 409 duplicate
    return this.prisma.contact.create({ data: { ...dto, source: 'manual' } });
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.getOrThrow(id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.contact.delete({ where: { id } });
  }

  async setPrimary(id: string) {
    const contact = await this.getOrThrow(id);
    // Tek transaction: aradaki bir hata iki birincil kisi birakirsa
    // "kime yazacagiz" sorusu belirsiz kalir.
    return this.prisma.$transaction(async (tx) => {
      await tx.contact.updateMany({
        where: { companyId: contact.companyId, isPrimary: true },
        data: { isPrimary: false },
      });
      return tx.contact.update({ where: { id }, data: { isPrimary: true } });
    });
  }

  private async getOrThrow(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundException({ code: 'not_found', message: 'Kisi bulunamadi' });
    }
    return contact;
  }
}

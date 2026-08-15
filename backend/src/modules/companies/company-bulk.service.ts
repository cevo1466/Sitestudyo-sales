import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DncType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanyQuery } from './company-query';
import { PROMOTE_LIMIT, type BulkDto, type BulkResult } from './bulk.dto';

/** Tek seferde islenecek satir sayisi — cok buyuk INSERT'ler kilit suresini uzatir. */
const BATCH = 500;

@Injectable()
export class CompanyBulkService {
  constructor(private readonly prisma: PrismaService) {}

  async run(dto: BulkDto, _userId: string): Promise<BulkResult> {
    // Bos filtre = tum havuz. Kazara "hepsini etiketle" geri alinmasi zor bir
    // hata; en az bir daraltma kosulu sart.
    if (Object.keys(dto.filter).length === 0) {
      throw new BadRequestException({
        code: 'empty_filter_not_allowed',
        message: 'Toplu islem icin en az bir filtre secmelisiniz',
      });
    }

    const where: Prisma.CompanyWhereInput = {
      AND: [
        CompanyQuery.toWhere(dto.filter),
        ...(dto.excludeIds.length ? [{ id: { notIn: dto.excludeIds } }] : []),
      ],
    };

    const matched = await this.prisma.company.count({ where });

    // Once dogrula, SONRA yaz. Sirasi tersine donerse kismen uygulanmis bir
    // islem kalir ve kullanici neyin degistigini bilemez.
    if (dto.confirmCount !== undefined && dto.confirmCount !== matched) {
      throw new ConflictException({
        code: 'count_mismatch',
        message: `Kayit sayisi degismis: ekranda ${dto.confirmCount} vardi, simdi ${matched}. Listeyi yenileyip tekrar deneyin.`,
      });
    }

    if (dto.action === 'promote' && matched > PROMOTE_LIMIT) {
      throw new BadRequestException({
        code: 'bulk_limit_exceeded',
        message: `Tek seferde en fazla ${PROMOTE_LIMIT} isletme huniye alinabilir (${matched} secildi). Filtreyi daraltin.`,
      });
    }

    if (dto.action === 'tag' || dto.action === 'untag') {
      const tagIds = dto.payload.tagIds ?? [];
      if (!tagIds.length) {
        throw new BadRequestException({
          code: 'validation_error',
          message: 'Etiket secilmedi',
          fields: { 'payload.tagIds': 'En az bir etiket gerekli' },
        });
      }
      const existing = await this.prisma.tag.count({ where: { id: { in: tagIds } } });
      if (existing !== tagIds.length) {
        throw new BadRequestException({
          code: 'validation_error',
          message: 'Secilen etiketlerden biri bulunamadi',
          fields: { 'payload.tagIds': 'Gecersiz etiket' },
        });
      }
    }

    const ids = await this.collectIds(where);
    let applied = 0;

    for (let i = 0; i < ids.length; i += BATCH) {
      applied += await this.applyBatch(dto, ids.slice(i, i + BATCH));
    }

    return { matched, applied, skipped: matched - Math.min(applied, matched) };
  }

  /** Etkilenecek kimlikleri toplar. Yalnizca id cekiyoruz — tum satir gereksiz. */
  private async collectIds(where: Prisma.CompanyWhereInput): Promise<string[]> {
    const rows = await this.prisma.company.findMany({ where, select: { id: true } });
    return rows.map((r) => r.id);
  }

  private async applyBatch(dto: BulkDto, companyIds: string[]): Promise<number> {
    switch (dto.action) {
      case 'tag': {
        const data = companyIds.flatMap((companyId) =>
          (dto.payload.tagIds ?? []).map((tagId) => ({ companyId, tagId })),
        );
        // skipDuplicates: ayni etiket ikinci kez uygulanirsa hata vermek yerine
        // atlanir — kullanici acisindan "zaten etiketliydi" bir hata degil.
        await this.prisma.companyTag.createMany({ data, skipDuplicates: true });
        return companyIds.length;
      }
      case 'untag': {
        await this.prisma.companyTag.deleteMany({
          where: { companyId: { in: companyIds }, tagId: { in: dto.payload.tagIds ?? [] } },
        });
        return companyIds.length;
      }
      case 'dnc': {
        const rows = await this.prisma.company.findMany({
          where: { id: { in: companyIds }, phoneE164: { not: null } },
          select: { phoneE164: true },
        });
        const res = await this.prisma.doNotContact.createMany({
          data: rows.map((r) => ({
            type: DncType.PHONE,
            value: r.phoneE164!,
            reason: 'Toplu islemle eklendi',
          })),
          skipDuplicates: true,
        });
        return res.count;
      }
      case 'promote':
        // Gorev 12'de leads modulu hazir olunca doldurulacak.
        throw new BadRequestException({
          code: 'not_implemented',
          message: 'Toplu terfi henuz kullanilabilir degil',
        });
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * "Sıcak Müşteri" -> "sicak-musteri"
   *
   * Slug hem filtre parametresi hem benzersizlik anahtari. Turkce karakter
   * icerirse URL'de yuzde kodlamasina girer ve "Ankara" ile "ankara" ayri
   * etiket olur — kullanici ikisini de olusturur, filtre ikisini de kacirir.
   */
  slugify(name: string): string {
    const map: Record<string, string> = {
      ç: 'c',
      ğ: 'g',
      ı: 'i',
      ö: 'o',
      ş: 's',
      ü: 'u',
      â: 'a',
      î: 'i',
      û: 'u',
    };
    return name
      .toLocaleLowerCase('tr')
      .replace(/[çğıöşüâîû]/g, (c) => map[c] ?? c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  list() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: { name: string; color?: string }) {
    // Slug benzersizligi semada tanimli; catisma olursa Prisma P2002 firlatir
    // ve HttpExceptionFilter onu 409 duplicate'e cevirir.
    return this.prisma.tag.create({
      data: { name: dto.name, slug: this.slugify(dto.name), color: dto.color ?? null },
    });
  }

  async remove(id: string): Promise<void> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException({ code: 'not_found', message: 'Etiket bulunamadi' });
    // company_tags uzerindeki iliski onDelete: Cascade — baglantilar silinir,
    // isletmelerin kendisi etkilenmez.
    await this.prisma.tag.delete({ where: { id } });
  }
}

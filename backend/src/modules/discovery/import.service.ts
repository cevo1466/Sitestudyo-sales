import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { normalizePlace, type NormalizedCompany } from './place-normalizer';
import type { RawPlace } from './place-provider.interface';

export interface ImportResult {
  seen: number;
  created: number;
  updated: number;
  duplicates: number;
  skipped: number;
  /** Eslenmemis kategoriler — sector_mappings'e eklenmeleri icin raporlanir. */
  unmappedCategories: string[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ham kayitlari havuza yazar. TEKRAR CALISTIRILABILIR: ayni veri iki kez
   * verilse de mukerrer satir olusmaz.
   *
   * Mukerrer onleme iki katmanli:
   *   1. placeId  — Google'in kimligi, birincil ve en guvenilir
   *   2. dedupeKey (ad + telefon) — placeId degisen veya farkli kaynaktan
   *      gelen ayni isletmeyi yakalar
   */
  async importPlaces(
    places: RawPlace[],
    opts: { onlyWithoutWebsite: boolean; source?: string },
  ): Promise<ImportResult> {
    const sectorMap = await this.loadSectorMap();
    const result: ImportResult = {
      seen: places.length,
      created: 0,
      updated: 0,
      duplicates: 0,
      skipped: 0,
      unmappedCategories: [],
    };
    const unmapped = new Set<string>();

    for (const place of places) {
      if (!place.placeId || !place.name?.trim()) {
        // Kimliksiz veya adsiz kayit hicbir ise yaramaz ve mukerrer
        // tespitini de bozar.
        result.skipped++;
        continue;
      }

      const c = normalizePlace(place, {
        sectorMap,
        onlyWithoutWebsite: opts.onlyWithoutWebsite,
        source: opts.source,
      });
      if (c.categoryRaw && !c.sector) unmapped.add(c.categoryRaw);

      const outcome = await this.upsertOne(c);
      result[outcome]++;
    }

    result.unmappedCategories = [...unmapped];
    return result;
  }

  private async upsertOne(c: NormalizedCompany): Promise<'created' | 'updated' | 'duplicates'> {
    const existing = await this.prisma.company.findUnique({ where: { placeId: c.placeId } });

    if (existing) {
      await this.prisma.company.update({
        where: { id: existing.id },
        data: this.updatableFields(c),
      });
      return 'updated';
    }

    // placeId yeni ama ayni isletme baska bir kimlikle girmis olabilir:
    // Google zaman zaman bir isletmeye yeni placeId veriyor. Ad+telefon
    // anahtari bunu yakalar.
    if (c.dedupeKey) {
      const twin = await this.prisma.company.findUnique({ where: { dedupeKey: c.dedupeKey } });
      if (twin) {
        // Yeni placeId'yi YAZMIYORUZ: eski kaydin gecmisi (notlar, is
        // kayitlari, aktiviteler) ona bagli. Yalnizca eksikleri tamamliyoruz.
        await this.prisma.company.update({
          where: { id: twin.id },
          data: this.fillMissingOnly(twin, c),
        });
        return 'duplicates';
      }
    }

    try {
      await this.prisma.company.create({ data: this.createFields(c) });
      return 'created';
    } catch (err) {
      // Es zamanli iki calisma ayni isletmeyi ayni anda yazabilir.
      // Yaris kaybedildiyse bu bir hata degil, mukerrerdir.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return 'duplicates';
      }
      throw err;
    }
  }

  private createFields(c: NormalizedCompany): Prisma.CompanyCreateInput {
    return {
      placeId: c.placeId,
      source: c.source,
      name: c.name,
      nameNormalized: c.nameNormalized,
      dedupeKey: c.dedupeKey,
      categoryRaw: c.categoryRaw,
      sector: c.sector,
      address: c.address,
      street: c.street,
      city: c.city,
      district: c.district,
      neighborhood: c.neighborhood,
      postalCode: c.postalCode,
      countryCode: c.countryCode,
      lat: c.lat,
      lng: c.lng,
      phone: c.phone,
      phoneE164: c.phoneE164,
      websiteUrl: c.websiteUrl,
      websiteDomain: c.websiteDomain,
      websiteStatus: c.websiteStatus,
      googleRating: c.googleRating,
      googleReviewsCount: c.googleReviewsCount,
      googleUrl: c.googleUrl,
      businessStatus: c.businessStatus,
      raw: c.raw as Prisma.InputJsonValue,
    };
  }

  /**
   * Yeniden taramada guncellenecek alanlar.
   *
   * `websiteStatus` BILEREK DISARIDA: Faz 4 analizoru siteyi olcup
   * ACTIVE_WEAK/BROKEN gibi bir deger yazmis olabilir. Ham tarama verisi
   * onun uzerine yazsaydi olculmus bilgi tahminle ezilirdi.
   * Ayni sebeple leadScore ve leadGrade de disarida.
   */
  private updatableFields(c: NormalizedCompany): Prisma.CompanyUpdateInput {
    return {
      name: c.name,
      nameNormalized: c.nameNormalized,
      categoryRaw: c.categoryRaw,
      ...(c.sector ? { sector: c.sector } : {}),
      address: c.address,
      city: c.city,
      district: c.district,
      neighborhood: c.neighborhood,
      postalCode: c.postalCode,
      lat: c.lat,
      lng: c.lng,
      ...(c.phone ? { phone: c.phone } : {}),
      ...(c.phoneE164 ? { phoneE164: c.phoneE164, dedupeKey: c.dedupeKey } : {}),
      // Site adresi YENI bulunduysa yazilir; var olani silmeyiz.
      ...(c.websiteUrl ? { websiteUrl: c.websiteUrl, websiteDomain: c.websiteDomain } : {}),
      googleRating: c.googleRating,
      googleReviewsCount: c.googleReviewsCount,
      businessStatus: c.businessStatus,
      raw: c.raw as Prisma.InputJsonValue,
    };
  }

  /** Ikiz kayitta yalnizca BOS alanlari doldurur, dolu olana dokunmaz. */
  private fillMissingOnly(
    existing: { phone: string | null; websiteUrl: string | null; address: string | null },
    c: NormalizedCompany,
  ): Prisma.CompanyUpdateInput {
    return {
      ...(existing.phone ? {} : { phone: c.phone }),
      ...(existing.websiteUrl || !c.websiteUrl
        ? {}
        : { websiteUrl: c.websiteUrl, websiteDomain: c.websiteDomain }),
      ...(existing.address ? {} : { address: c.address }),
    };
  }

  /**
   * Anahtarlar KUCUK HARFE cevrilerek yukleniyor.
   *
   * MySQL'in utf8mb4_unicode_ci siralamasi buyuk/kucuk harf duyarsiz:
   * "Nakliyat Şirketi" ile "Nakliyat şirketi" ayni satira duser. JavaScript
   * Map'i ise duyarli. Ikisi hizalanmazsa kategori sessizce eslenmemis
   * gorunur ve sektor filtresi o kayitlari hic bulamaz.
   */
  private async loadSectorMap(): Promise<Map<string, string>> {
    const rows = await this.prisma.sectorMapping.findMany();
    return new Map(rows.map((r) => [r.categoryRaw.toLocaleLowerCase('tr'), r.sector]));
  }
}

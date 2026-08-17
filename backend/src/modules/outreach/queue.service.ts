import { Injectable } from '@nestjs/common';
import { ActivityType, DncType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanyQuery } from '../companies/company-query';
import type { CompanyFilter } from '../companies/company-filter.dto';
import { OutreachService, COMPANY_FOR_MESSAGE_SELECT } from './outreach.service';
import { buildMessages, classifyPhone, whatsappUrl } from './message-builder';

/**
 * Gunluk calisma kuyrugu.
 *
 * SORUN: 2.045 kayitlik listede her sabah "bugun kiminle konusacagim"
 * elle bulunuyordu. Filtreyi kurmak, siralamak, dun yazdiklarini
 * hatirlamak — is yapmadan once yapilan is.
 *
 * TABLO EKLENMEDI. Kuyruk = filtre + siralama + limit; "kime dokundum"
 * bilgisi zaten `Activity` ve `Company.lastContactedAt` icinde ve
 * `ActivityService` bunun tek yazicisi. Ayri bir kuyruk tablosu ayni
 * gercegi ikinci kez saklamak olurdu; iki kaynak kacinilmaz olarak
 * ayrisiyor ve hangisinin dogru oldugu belirsiz kaliyor.
 *
 * Kuyrugun SIRASI ve kalinan yer de saklanmiyor: oturumluk bir calisma
 * artefakti, masaustunde localStorage'da duruyor. Sunucuya yazmak
 * "hangi cihazda kaldim" senkronizasyon sorunu acardi ve tek kullanicili
 * bir sistemde bunun karsiligi yok.
 */

/** Bir oturumda bitirilebilecek makul ust sinir. */
export const QUEUE_MAX = 50;

@Injectable()
export class WorkQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outreach: OutreachService,
  ) {}

  /**
   * Gunun basi (yerel saat).
   *
   * Kuyrugun "bugun dokunmadiklarim" tanimi buna dayaniyor. UTC gun
   * basini kullanmak Turkiye'de sabah 03:00'e kadar dunku listeyi
   * gostermek olurdu.
   */
  private static startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Varsayilan gunluk filtre.
   *
   * Cagiran kendi filtresini verebiliyor; verilen alanlar varsayilani
   * eziyor. Boylece "Ankara'daki kafeler" gibi bir gunluk liste de
   * kurulabiliyor.
   *
   * LEAD SINIFI FILTRESI YOK ve bu bilincli: havuzdaki puan tavani su an
   * 75, "Sicak" esigi 70 — VERY_HOT/HOT'a daraltmak kuyrugu cogu gun BOS
   * gosterirdi ve ekran bozuk sanilirdi. Siralama zaten skora gore
   * azalan, yani en iyiler basta; daraltmanin kazanci yok.
   */
  private static defaultFilter(): CompanyFilter {
    return {
      mobileOnly: true,
      notContactedSince: WorkQueueService.startOfToday(),
    } as CompanyFilter;
  }

  /**
   * Temas edilmeyecekler listesindeki numaralari ayiklar.
   *
   * DNC telefon NUMARASINA bagli, isletmeye degil — ayni numarayi
   * paylasan iki kayit varsa ikisi de dusuyor. Bu yuzden filtreyi
   * SQL'e cevirmek yerine sonuc uzerinde uyguluyoruz; karsiliginda
   * limitin biraz fazlasini cekiyoruz.
   */
  private async blockedPhones(phones: string[]): Promise<Set<string>> {
    if (!phones.length) return new Set();
    const rows = await this.prisma.doNotContact.findMany({
      where: { type: DncType.PHONE, value: { in: phones } },
      select: { value: true },
    });
    return new Set(rows.map((r) => r.value));
  }

  /** Bugun WhatsApp'i acilmis isletme sayisi (ilerleme gostergesi). */
  async doneToday(): Promise<number> {
    const rows = await this.prisma.activity.findMany({
      where: {
        type: ActivityType.WHATSAPP,
        occurredAt: { gte: WorkQueueService.startOfToday() },
        companyId: { not: null },
      },
      select: { companyId: true },
      distinct: ['companyId'],
    });
    return rows.length;
  }

  /**
   * Kuyrugu HAZIR METINLERLE kurar.
   *
   * TEK findMany + sablonlar bir kez + kurallar bir kez + DNC listesi tek
   * sorguda. Isletme basina sorgu atilirsa 50 kayit 150 sorgu eder ve
   * kullanici her kartta bekler — kuyrugun butun amaci beklememek.
   *
   * Metinler ONCEDEN uretiliyor ama HICBIR SEY GONDERILMIYOR. Toplu
   * otomatik gonderim yok ve olmayacak: WhatsApp'a gonder tusuna her
   * seferinde insan basiyor. Otomatik gonderim hem numaranin banlanmasi
   * hem de yanlis isletmeye yanlis metin gitmesi riski.
   */
  async prepare(filter: Partial<CompanyFilter>, limit: number) {
    const take = Math.min(limit, QUEUE_MAX);
    const merged = { ...WorkQueueService.defaultFilter(), ...filter } as CompanyFilter;
    const where = CompanyQuery.toWhere(merged);

    const rows = await this.prisma.company.findMany({
      where,
      orderBy: [{ leadScore: 'desc' }, { id: 'desc' }],
      take: take * 2,
      select: COMPANY_FOR_MESSAGE_SELECT,
    });

    const blocked = await this.blockedPhones(
      rows.map((r) => r.phoneE164).filter((p): p is string => Boolean(p)),
    );
    const [templates, rules] = await Promise.all([
      this.outreach.listTemplates(),
      // Skor kirilimi mesajdaki {{skorGerekce}} icin gerekiyor; kurallar
      // dongu DISINDA bir kez yukleniyor.
      this.prisma.leadScoreRule.findMany().then((rs) =>
        rs.map((r) => ({ key: r.key, label: r.label, weight: r.weight, enabled: r.enabled })),
      ),
    ]);

    return {
      items: rows
        .filter((r) => r.phoneE164 && !blocked.has(r.phoneE164))
        .slice(0, take)
        .map((r) => {
          const messages = buildMessages(this.outreach.toCompanyForMessage(r, rules), templates);
          return {
            companyId: r.id,
            name: r.name,
            district: r.district,
            city: r.city,
            phone: r.phone,
            phoneE164: r.phoneE164,
            phoneKind: classifyPhone(r.phoneE164),
            leadScore: r.leadScore,
            leadGrade: r.leadGrade,
            recommendedKey: messages.find((m) => m.recommended)?.key ?? null,
            messages: messages.map((m) => ({
              ...m,
              url: whatsappUrl(r.phoneE164!, m.text),
            })),
          };
        }),
      /** Filtreye uyan toplam kayit — kuyrugun ne kadarini gordugunu soyler. */
      total: await this.prisma.company.count({ where }),
      doneToday: await this.doneToday(),
    };
  }
}

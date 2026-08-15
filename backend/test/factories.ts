import { randomUUID, createHash } from 'node:crypto';
import { LeadGrade, PrismaClient, WebsiteStatus } from '@prisma/client';

export interface CompanyOverrides {
  name?: string;
  city?: string;
  district?: string;
  sector?: string;
  websiteStatus?: WebsiteStatus;
  leadGrade?: LeadGrade;
  leadScore?: number;
  phoneE164?: string | null;
  googleRating?: number | null;
}

/**
 * e2e testlerde isletme uretir.
 *
 * placeId "test-" ile basliyor: temizlik bu one ekle uzerinden yuruyor,
 * boylece gercek verinin yaninda calissa bile testler onu silmez.
 */
export async function makeCompany(prisma: PrismaClient, o: CompanyOverrides = {}) {
  const name = o.name ?? `Test Isletme ${randomUUID().slice(0, 8)}`;
  const nameNormalized = name.toLocaleLowerCase('tr');
  return prisma.company.create({
    data: {
      placeId: `test-${randomUUID()}`,
      source: 'manual',
      name,
      nameNormalized,
      dedupeKey: createHash('sha256').update(`${nameNormalized}|${randomUUID()}`).digest('hex'),
      city: o.city ?? 'Istanbul',
      district: o.district ?? 'Fatih',
      sector: o.sector ?? 'guzellik',
      websiteStatus: o.websiteStatus ?? WebsiteStatus.UNKNOWN,
      leadGrade: o.leadGrade ?? LeadGrade.LOW,
      leadScore: o.leadScore ?? 0,
      phoneE164: o.phoneE164 === undefined ? `+9055512${Math.floor(Math.random() * 100000)}` : o.phoneE164,
      googleRating: o.googleRating ?? null,
    },
  });
}

/** Testin actigi tum isletmeleri (ve bagli kayitlari) temizler. */
export async function cleanupCompanies(prisma: PrismaClient) {
  await prisma.company.deleteMany({ where: { placeId: { startsWith: 'test-' } } });
}

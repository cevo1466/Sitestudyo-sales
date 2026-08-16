import { LeadGrade, WebsiteStatus } from '@prisma/client';

/** Puanlamaya giren tum veriler — saf fonksiyon olsun diye tek nesnede. */
export interface ScoreInput {
  websiteStatus: WebsiteStatus;
  googleRating: number | null;
  googleReviewsCount: number | null;
  phoneE164: string | null;
  hasEmail: boolean;
  /** En son site analizi; hic analiz yapilmadiysa null. */
  analysis: {
    isResponsive: boolean | null;
    sslValid: boolean | null;
    hasContactForm: boolean | null;
  } | null;
}

/** Admin ekranindan degistirilebilen agirlik. */
export interface ScoreRule {
  key: string;
  label: string;
  weight: number;
  enabled: boolean;
}

export interface ScoreReason {
  key: string;
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  grade: LeadGrade;
  /**
   * Puanin NEDEN o kadar oldugu.
   *
   * Skoru tek bir sayi olarak gostermek onu sihirli bir kutuya cevirir:
   * kullanici 65'e guvenmez, guvenmediginde de kullanmaz. Kirilim, hem
   * ikna eder hem de agirliklarin yanlis ayarlandigini gorunur kilar.
   */
  reasons: ScoreReason[];
}

/**
 * Web sitesi durumu kovalari BIRBIRINI DISLAR.
 *
 * Bir isletme ayni anda hem "sitesi yok" hem "sitesi bozuk" olamaz.
 * Kontrol edilmezse iki kural birden uygulanir ve puan sisirilir.
 */
const WEBSITE_RULE: Partial<Record<WebsiteStatus, string>> = {
  [WebsiteStatus.NO_WEBSITE]: 'no_website',
  [WebsiteStatus.SOCIAL_ONLY]: 'social_only',
  [WebsiteStatus.BROKEN]: 'broken_website',
  [WebsiteStatus.OUTDATED]: 'outdated_weak',
  [WebsiteStatus.ACTIVE_WEAK]: 'outdated_weak',
  // ACTIVE_GOOD ve UNKNOWN puan getirmez: ilki zaten iyi bir siteye
  // sahip (dusuk oncelik), ikincisi henuz olculmedi.
};

export const GRADE_THRESHOLDS = [
  { min: 90, grade: LeadGrade.VERY_HOT },
  { min: 70, grade: LeadGrade.HOT },
  { min: 50, grade: LeadGrade.WARM },
  { min: 0, grade: LeadGrade.LOW },
] as const;

export function gradeFor(score: number): LeadGrade {
  return GRADE_THRESHOLDS.find((t) => score >= t.min)!.grade;
}

/**
 * Lead puanini hesaplar.
 *
 * Saf fonksiyon: veritabanina dokunmaz, agirliklari disaridan alir.
 * Boylece "bu isletme neden 65 aldi" sorusu tek bir testle cevaplanabilir
 * ve agirlik degisikligi tum sistemi yeniden calistirmadan denenebilir.
 */
export function scoreLead(input: ScoreInput, rules: ScoreRule[]): ScoreResult {
  const byKey = new Map(rules.filter((r) => r.enabled).map((r) => [r.key, r]));
  const reasons: ScoreReason[] = [];

  const add = (key: string, condition: boolean): void => {
    if (!condition) return;
    const rule = byKey.get(key);
    if (!rule) return; // kural kapatilmis veya tanimsiz
    reasons.push({ key, label: rule.label, points: rule.weight });
  };

  // --- Site durumu: yalnizca BIR tanesi uygulanir ---
  const websiteRule = WEBSITE_RULE[input.websiteStatus];
  if (websiteRule) add(websiteRule, true);

  // --- Olculmus site sorunlari (analiz yapildiysa) ---
  if (input.analysis) {
    add('not_responsive', input.analysis.isResponsive === false);
    add('ssl_problem', input.analysis.sslValid === false);
    add('no_contact_form', input.analysis.hasContactForm === false);
  }

  // --- Isletmenin canliligi: bu isaretler "para kazanan, ulasilabilir
  //     bir isletme" demek; teklif goturmeye deger olup olmadigini soyler ---
  add('high_rating', (input.googleRating ?? 0) >= 4.0);
  add('many_reviews', (input.googleReviewsCount ?? 0) >= 50);
  add('phone_available', Boolean(input.phoneE164));
  add('email_found', input.hasEmail);

  const raw = reasons.reduce((sum, r) => sum + r.points, 0);
  // 100'e kirpiyoruz: agirliklar admin tarafindan yukseltilirse toplam
  // 100'u asabilir ve "yuzde" olarak gosterilen skor anlamsizlasir.
  const score = Math.max(0, Math.min(100, raw));

  return { score, grade: gradeFor(score), reasons };
}

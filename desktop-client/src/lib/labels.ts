/**
 * Kullaniciya gorunen etiketlerin TEK kaynagi.
 *
 * Burasi olmadan once her ekran kendi sozlugunu tutuyordu: Ayarlar ekrani
 * dereceleri Turkce yaziyordu ama cekmece ham enum degerini basiyor ve
 * ekranda "WARM" gorunuyordu. Sunucudan gelen bir enum kullaniciya
 * dogrudan gosterilecekse cevirisi buraya yazilir.
 */

/** Lead derecesi. Sunucudaki `LeadGrade` enum'unun karsiligi. */
export const GRADE_LABEL: Record<string, string> = {
  VERY_HOT: 'Çok sıcak',
  HOT: 'Sıcak',
  WARM: 'Ilık',
  LOW: 'Düşük',
};

/** Web sitesi durumu. Sunucudaki `WebsiteStatus` enum'unun karsiligi. */
export const WEBSITE_STATUS_LABEL: Record<string, string> = {
  NO_WEBSITE: 'Sitesi yok',
  SOCIAL_ONLY: 'Sadece sosyal medya',
  BROKEN: 'Site açılmıyor',
  OUTDATED: 'Site eski',
  ACTIVE_WEAK: 'Site zayıf',
  ACTIVE_GOOD: 'Site iyi',
  UNKNOWN: 'Bilinmiyor',
};

/**
 * Ceviriyi bul, yoksa gelen degeri OLDUGU GIBI dondur.
 *
 * Sunucuya yeni bir enum degeri eklenip buraya yazilmadiginda ekranin bos
 * kalmasindansa ham degeri gostermesi yeglenir: bos hucre hata gibi
 * gorunmez ve kimse fark etmez, ham deger ise hemen goze batar.
 */
export function label(dict: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—';
  return dict[value] ?? value;
}

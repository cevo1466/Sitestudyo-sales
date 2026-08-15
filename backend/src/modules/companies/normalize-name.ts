/**
 * Mukerrer tespiti icin isletme adini sadelestirir.
 *
 * Turkce'de I/i donusumu yerele bagli: 'I'.toLowerCase() Turkce yerelde 'ı'
 * verir. Yerel bagimli davranis makineden makineye degisir ve ayni isletme
 * iki farkli anahtar uretebilir; bu yuzden 'tr' yereli ACIKCA veriliyor.
 */
export function normalizeName(name: string): string {
  return name.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

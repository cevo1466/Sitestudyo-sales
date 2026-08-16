/**
 * Tema secimi.
 *
 * Jetonlar (packages/design/tokens.css) uc durumu destekliyor:
 *   .light           -> acik
 *   .dark            -> koyu
 *   sinif yok        -> isletim sistemi tercihi (prefers-color-scheme)
 *
 * Dugme yalnizca acik/koyu arasinda gidip geliyor. Ucuncu bir "sistem"
 * konumu tek dugmede anlasilmaz olurdu; bunun yerine ILK acilista sistem
 * tercihi okunuyor, kullanici degistirdigi an secimi kaydediliyor.
 */

const KEY = 'salesos.theme';

export type Theme = 'light' | 'dark';

function systemPrefers(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === 'light' || saved === 'dark' ? saved : systemPrefers();
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  // Tarayicinin kendi parcalari (kaydirma cubugu, form ogeleri, secim
  // rengi) da temaya uysun; aksi halde koyu ekranda beyaz kaydirma
  // cubugu kaliyor.
  root.style.colorScheme = theme;
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

/**
 * Uygulama acilir acilmaz cagrilir (React'ten ONCE).
 *
 * React'in ilk cizimini beklemek, koyu tema secili kullanicilarda bir an
 * icin beyaz ekran parlamasina yol aciyor — karanlik odada rahatsiz edici.
 */
export function initTheme(): void {
  applyTheme(readTheme());
}

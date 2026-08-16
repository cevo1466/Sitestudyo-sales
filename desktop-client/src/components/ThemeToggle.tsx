import { useState } from 'react';
import { readTheme, saveTheme, type Theme } from '../services/theme';

/**
 * Tema dugmesi.
 *
 * Sessiz duruyor: bu bir ozellik degil, bir tercih. Ust cubukta kullanici
 * adinin yaninda, ikon boyutunda. Yaziyla "Koyu tema" yazmak, gunde bir
 * kez dokunulan bir seye tablo kadar yer ayirmak olurdu.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  function toggle(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    setTheme(next);
  }

  const isDark = theme === 'dark';
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      {isDark ? (
        // Gunes — acik temaya gecis
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7L5.4 5.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Ay — koyu temaya gecis
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.5 14.3A8.5 8.5 0 019.7 3.5a8.5 8.5 0 1010.8 10.8z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

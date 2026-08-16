// ESLint 9 duz yapilandirmasi.
//
// CI'da `npm run lint` bu dosya olmadan hic calismiyordu: ESLint 9
// .eslintrc.* dosyalarini artik okumuyor ve yapilandirma bulamayinca
// hata verip cikiyor. Yani lint adimi yesil gorunmuyordu ama kod da
// denetlenmiyordu — hata mesaji kod hatasi degil kurulum hatasiydi.
// Meta paket `typescript-eslint` yerine eklenti ve ayristirici DOGRUDAN
// kullaniliyor: ikisi zaten bagimliliklarda vardi ve meta paketi eklemek
// @eslint/js'i 10'a cekip eslint 9 ile catisiyordu.
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'prisma/**', 'coverage/**', '*.mjs'] },
  {
    files: ['**/*.ts'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly',
                 setTimeout: 'readonly', clearTimeout: 'readonly',
                 setInterval: 'readonly', clearInterval: 'readonly',
                 fetch: 'readonly', URL: 'readonly', URLSearchParams: 'readonly',
                 AbortController: 'readonly', TextEncoder: 'readonly',
                 TextDecoder: 'readonly', __dirname: 'readonly' },
    },
    rules: {
      // Nest bagimlilik enjeksiyonu ve Prisma JSON alanlari `any` uretiyor;
      // bunlari hata saymak kodu daha guvenli yapmiyor, sadece susturma
      // yorumlariyla dolduruyor.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Testlerde jest kuresel degiskenleri var.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly',
                 beforeAll: 'readonly', afterAll: 'readonly',
                 beforeEach: 'readonly', afterEach: 'readonly',
                 jest: 'readonly' },
    },
  },
  prettier,
];

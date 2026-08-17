/**
 * Harici baglantiyi isletim sisteminin varsayilan tarayicisinda acar.
 *
 * NEDEN AYRI BIR SERVIS: uygulama 0.2.6'ya kadar wa.me baglantisini
 * `window.open` ile aciyordu. Bu tarayicida (gelistirme sunucusunda)
 * calisiyor ama PAKETLENMIS masaustu uygulamasinda HICBIR SEY yapmiyor —
 * Tauri webview'unde harici gezinme icin kayitli bir handler yok, cagri
 * sessizce yutuluyor. Ekran yine de "WhatsApp acildi" yaziyordu ve zaman
 * tunelinde olmayan bir temas duruyordu. Bir sistemin yanlis sey yapmasi
 * kotu, yanlis sey yapip dogru yaptigini soylemesi daha kotu.
 *
 * Bu yuzden buradaki tek kural: BASARISIZLIK YUTULMAZ. Cagiran taraf
 * hatayi gorur ve kaydi olusturmaz.
 */

/** Tauri eklentileri yalnizca masaustunde var; tarayicida import patlar. */
function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export type OpenedVia = 'tauri' | 'browser';

/**
 * Baglantiyi acar. Acilamazsa HATA FIRLATIR.
 *
 * Masaustunde `opener` eklentisi kullanilir; izin
 * `src-tauri/capabilities/default.json` icinde yalnizca `https://wa.me/*`
 * kapsamiyla verilmis. Keyfi adres acabilen bir masaustu uygulamasi,
 * sunucudan gelen tek bir kotu alan adiyla istismar araci olur.
 *
 * Tarayicida `window.open`; donusu `null` ise acilir pencere engellenmis
 * demektir ve bu da bir hatadir, sessizce gecilmez.
 */
export async function openExternal(url: string): Promise<OpenedVia> {
  if (isDesktop()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
    return 'tauri';
  }
  const win = window.open(url, '_blank', 'noopener');
  if (!win) throw new Error('Tarayıcı yeni sekmeyi engelledi');
  return 'browser';
}

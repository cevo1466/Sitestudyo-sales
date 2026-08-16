/**
 * e2e testleri AYRI bir veritabaninda kosar.
 *
 * Baslangicta canli veritabani kullaniliyordu ve testler bos bir havuz
 * varsayarak kesin sayilar dogruluyordu ("Ankara = 20 kayit"). Havuza
 * 2.045 gercek isletme girince 13 test kirildi — kodda degil, izolasyonda
 * hata vardi. Test verisi ile is verisinin ayni tabloda durmasi, hangisinin
 * hangisini bozdugunu da anlasilmaz kilar.
 */
const url = process.env.DATABASE_URL ?? '';
if (url && !/\/salesos_test(\?|$)/.test(url)) {
  process.env.DATABASE_URL = url.replace(/\/salesos(\?|$)/, '/salesos_test$1');
}

# Shotpot i18n

Türkçe metinler `tr.ts` içinde sayfa/özellik bazlı kategorilendi. Yeni dil eklerken aynı yapıda ikinci bir dosya oluştur:

1. `en.ts` dosyasında `tr` ile aynı anahtarları doldur.
2. `index.ts` içindeki `dictionaries` objesine `en` ekle.
3. Locale seçimi eklendiğinde sayfalar `getCopy(locale)` ile doğru sözlüğü okuyabilir.

Kategoriler:

- `meta`: HTML dil, başlık ve açıklama metinleri.
- `common`: Uygulama genelindeki kısa komutlar ve tekrar eden etiketler.
- `landing`: Ana sayfa, hero, faydalar, SSS, CTA ve footer.
- `pricing`: Paket isimleri, fiyat açıklamaları ve özellik listeleri.
- `auth`: Login/signup sayfaları ve ortak auth kabuğu.
- `dashboard`: İşletme paneli, menü, kartlar ve silme uyarıları.
- `studio`: Slot kurulum akışı.
- `play`: Müşteri oyun/fiş/kupon akışı.
- `scan`: Garson kupon doğrulama ekranı.
- `billing`: Paddle plan ve ödeme ekranı.
- `legal`: Yasal sayfaların başlıkları.

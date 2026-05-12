# Shotpot i18n

Türkçe metinler `tr.ts` içinde sayfa/özellik bazlı kategorilendi. Yeni dil eklerken aynı yapıda ikinci bir dosya oluştur:

1. Yeni dil dosyasında `tr` ile aynı anahtarları doldur.
2. `index.ts` içindeki `dictionaries` objesine yeni locale anahtarını ekle.
3. Server component'lerde `getServerCopy()`, client component'lerde prop veya `getClientCopy()` kullan.

Mevcut diller:

- `tr`: Türkçe varsayılan dil.
- `en`: İngilizce.

Dil seçimi `shotpot_locale` cookie'si ile saklanır. `LanguageToggle` bu cookie'yi değiştirip sayfayı yeniden yükler.

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

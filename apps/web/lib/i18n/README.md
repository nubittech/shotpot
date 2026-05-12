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
- `dashboardPages`: Dashboard alt sayfaları: analitik, müşteriler, kuponlar ve müşteri detayları.
- `studio`: Slot kurulum akışı.
- `play`: İşletme diline göre çalışan müşteri oyun, fiş okuma, jackpot ve kupon akışı.
- `scan`: İşletme diline göre çalışan garson kupon doğrulama ekranı.
- `billing`: Paddle plan ve ödeme ekranı.
- `legal`: Yasal sayfaların başlıkları.

Dil kapsamındaki sayfalar:

- Landing: `apps/web/app/page.tsx`, `apps/web/components/LandingPricing.tsx`.
- Auth: `apps/web/app/login/page.tsx`, `apps/web/app/signup/page.tsx`, `apps/web/components/AuthShell.tsx`.
- Dashboard ana ekran: `apps/web/app/dashboard/page.tsx`.
- Dashboard menü sayfaları:
  - `apps/web/app/dashboard/analytics/[slug]/page.tsx`
  - `apps/web/app/dashboard/customers/[slug]/page.tsx`
  - `apps/web/app/dashboard/customers/[slug]/[customerId]/page.tsx`
  - `apps/web/app/dashboard/coupons/page.tsx`
  - `apps/web/app/dashboard/coupons/[slug]/page.tsx`
  - `apps/web/app/dashboard/billing/[slug]/page.tsx`
  - `apps/web/app/dashboard/billing/[slug]/BillingClient.tsx`
- Dashboard ortak butonlar:
  - `apps/web/app/dashboard/CopyLinkButton.tsx`
  - `apps/web/app/dashboard/DeleteVenueButton.tsx`
  - `apps/web/app/dashboard/LogoutButton.tsx`
- Studio: `apps/web/app/studio/page.tsx`.
- Play/scan:
  - `apps/web/app/play/[slug]/page.tsx`
  - `apps/web/app/play/[slug]/PlayClient.tsx`
  - `apps/web/app/scan/page.tsx`
  - `apps/web/app/api/play/venue-language/route.ts`
  - `apps/web/components/SlotMachine.tsx`
  - `apps/web/components/slot/*`
- Legal: `apps/web/app/terms/page.tsx`, `apps/web/app/privacy/page.tsx`, `apps/web/app/refund/page.tsx`.

Yeni dil eklerken kontrol sırası:

1. `tr.ts` ile aynı yapıda yeni locale dosyasını oluştur.
2. `index.ts` içindeki `dictionaries` ve `isLocale()` içine yeni dili ekle.
3. Yukarıdaki sayfaları hızlıca açıp hardcoded metin kalıp kalmadığını ara.
4. `rg -n "Türkçe metin|Analitik|Müşteriler|Kuponlar|Ödeme|İşletme|Henüz|Kullanıldı" apps/web/app apps/web/components` benzeri arama ile kaçak metinleri yakala.

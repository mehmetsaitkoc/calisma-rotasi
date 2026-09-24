# Rota — premium arayüz v8

## Kapsam ve başlangıç durumu

Temel: main `aa274ee64cd02d1b11efc83764bbf990867d4e69`. Çalışma dalı: `codex/rota-premium-ui`.
Mevcut açık tasarım ve motor dalları değiştirilmedi. Main'e merge veya canlıya dağıtım yapılmadı.

Uygulama Node sunucusu üzerinde statik HTML/CSS ve vanilla JavaScript kullanıyor. Rota motoru ve temel render fonksiyonları `public/index.html` içinde; katalog, veri şeması, sunucu ve motor sözleşmeleri ayrı modüllerde. Bugün ve Programım ekranları `app-premium-next.js` sunum katmanıyla gerçek DOM düğümlerini kullanıyor.

İncelemede tespit edilenler:

- 7.000 satırı aşan ardışık stil denemeleri; tekrar eden selector ve `!important` çakışmaları.
- Ana görsele gömülmüş eski tarih/isim/yazılar ve bunların üzerindeki canlı metinler.
- 8–10px yardımcı yazılar, dar dokunma hedefleri ve farklı buton/kart ölçüleri.
- Bugün/Programım gözlemcilerinin kendi DOM değişikliklerini tekrar izlemesi.
- Boş deneme verisinde `null` değerinin yanlışlıkla 0 net gösterilmesi.
- Onboarding'de kaldırılmış Rota Hoca vaadi; Programım'da içerikten önce kalan alt bilgi.

## Görsel sistem

`rota-foundations.css`: ortak tokenlar, typography, Button/Card/Badge, form seçenekleri, modal, loading/empty/error ve ikincil ekranlar.
`rota-dashboard.css`: uygulama çerçevesi, Bugün kompozisyonu, görev listesi, gerçek sayaç, veri kartları ve mobil alt navigasyon.

Yeni stiller tek `@layer rota` katmanında: önceki sürümlerin yüksek öncelikli kurallarıyla oluşan çakışmalar kontrollü biçimde çözülüyor. Son 225 satırlık eski hero/polish denemesi kaldırıldı; eski ürün özellikleri ve temel stiller korunuyor.

| Rol | Açık tema |
|---|---|
| Primary | #3157F5 |
| Secondary / ana metin | #15213A |
| Accent | #5675ED |
| Background | #F3F6FC |
| Surface | #FFFFFF |
| Border | #E4EAF3 |
| Secondary text | #65738B |
| Success | #168567 |
| Warning | #B77915 |
| Danger | #D3485A |

Sistem fontu kullanılıyor. Yeni font, icon, animasyon veya framework bağımlılığı yok. Çizgisel SVG ikonlar, 44px görev dokunma alanları, safe-area alt boşluğu, görünür klavye odağı ve reduced-motion desteği mevcut.

Yeni panorama: `public/rota-journey-v8.webp`, 1920×640, yaklaşık 72KB. Yazı ve UI içermiyor; isim, tarih ve başlık gerçek HTML. Built-in imagegen ile üretildi.

Prompt: "Use case: photorealistic-natural. Asset type: quiet panoramic hero background for a premium study-planning web application. Create a high-quality 3:1 wide photographic landscape of a peaceful blue mountain sunrise. Layered blue ridges recede into soft mist; distant snowy peaks; a small backpacked hiker viewed from behind stands calmly on a rocky overlook at about 65 percent of image width in the lower half. Preserve the entire left 40 percent as pale blue mist and luminous sky with extremely low visual detail and contrast for separate live HTML text. Terrain details and hiker concentrate at center-right. Warm sunrise glows toward the right; no harsh sun flare. Premium travel editorial photography, soft atmospheric light, hopeful and calm, realistic natural rock and mountain textures. Pale cool blue at left, layered slate and alpine blue mountains, gentle cream and warm peach sunrise on the right. Subdued saturation and contrast suitable behind a light dashboard. Photographic not cartoon; no text, lettering, numbers, quote, handwriting, logo, watermark, border, UI, panels, charts, or interface. One small hiker only. Render the panorama as the image itself, no mockup."

## Korunan çalışan akışlar

- Onboarding → kişisel rota → Bugün / haftalık Programım.
- Görev başlatma, tamamlama, erteleme/geri alma, atlama ve yeniden dağıtma.
- Pomodoro, duraklatma/devam, sıfırlama, serbest sayaç, çalışma kaydı.
- Deneme ekleme ve analiz → konu onarımı → gerçek tamamlanma tarihinden +3/+7 tekrar.
- Mastery, ONARIM/DENGE/İLERLEME ve DecisionTrace çıktıları.
- Konular, ders kütüphanesi, video/kaynak, notlar, yanlış defteri ve günlük.
- Yerel kayıtlar, migration, JSON yedek, CSV ve Free/Plus rapor sınırları.
- Gün/gece tercihi.

Motor, API, sunucu, veri şeması, katalog ve hesaplama modülleri değiştirilmedi. `index.html` değişiklikleri üç UI markup düzeltmesiyle sınırlı. Profil butonu mevcut Ayarlar akışını açıyor; adlar `textContent` ile yazılıyor. Gözlemciler artık kendi güncellemelerini izlemiyor; harici render ve gerçek sayaç çalışması korunuyor.

## Doğrulama

Başlangıç ve değişiklik sonrası: 24 contract/motor/pilot scripti geçti. Tam gerçek Chromium browser E2E ve KPSS-only E2E geçti.

- 30 sentetik profil, 27 scheduler senaryosu, 12 çok günlük öğrenme yolculuğu.
- 140 kısa dönem + 1.080 uzun dönem karar döngüsü.
- Bugün: 320, 375, 390, 430, 768, 1024, 1440, 1512px; açık/koyu tema, timer başlangıcında ekran konumunun korunması.
- 9 ikincil ekran: 320, 375, 390, 430, 768, 1280px; onboarding ve koyu tema dahil 66 geometri kontrolü, 0 yatay taşma, 0 sayfa JS hatası.
- Görev kontrolleri minimum 44px; uzun görev adları, son göreve kaydırma ve mobil menü erişimi doğrulandı.
- Gerçek uygulama boşta beklerken Bugün/Programım gözlemcileri tekrar çizim döngüsüne girmiyor; kullanıcı kaydırması korunuyor.
- Syntax ve `git diff --check` temiz.

Bu statik uygulamada ayrı lint/build komutu tanımlı değil. JavaScript syntax, sözleşme/motor testleri ve Node sunucusu üzerinden gerçek tarayıcı doğrulaması kullanıldı. Yerel çalışma bundled Node 24.19.0 ile yapıldı; repo Node koşulu >=24.21.0 <25. CI repodaki `.node-version` ile çalışır.

Çalıştırma: `node server.mjs`. Mevcut tam test zinciri: `npm test`. Tarayıcı kontrolü: Playwright kurulmuş ortamda `node scripts/browser-e2e.mjs`, `node scripts/kpss-only-browser-e2e.mjs`, `node scripts/app-visual-review.mjs`.

# Local Business Website Factory

Bu katman, mevcut Çalışma Rotası uygulamasını veya daha önce paylaşılmış statik demo URL’lerini bozmadan yerel işletme web sitesi demolarını ölçeklemek için eklenmiştir.

## Temel prensip

**Yeni işletme = yeni HTML/CSS/JS kopyalamak değil.**

Yeni müşteri için ana veri kaynağı:

`public/local-business-factory/businesses.js`

Ortak renderer:

`public/local-business-factory/factory.js`

Ortak tasarım sistemi:

`public/local-business-factory/factory.css`

Satışta gösterilecek demo galerisi:

`/website-factory.html`

Tek işletme demo shell’i:

`/business-demo.html?business=<slug>`

## Yeni müşteri nasıl eklenir?

1. `BUSINESSES` içine yeni bir slug ekle.
2. `industry` alanında mevcut preset’lerden birini seç.
3. İşletme adı, hero metni, renkler, hizmetler ve görselleri doldur.
4. Doğrulanmış iletişim bilgileri elindeyse `contact` alanına ekle.
5. Bilgiler doğrulanmışsa yalnızca o zaman `verified: true` kullan.
6. `npm run factory:test` çalıştır.
7. Demo URL’sini aç: `/business-demo.html?business=<slug>`.

Örnek:

```js
"ahmet-oto": {
  slug: "ahmet-oto",
  name: "Ahmet Oto",
  eyebrow: "Bakım • Servis",
  industry: "auto-service",
  family: "industrial",
  heroVariant: "split",
  verified: true,
  tagline: "Aracın için hızlı ve net servis.",
  description: "Doğrulanmış işletme açıklaması.",
  heroImage: "https://...",
  gallery: ["https://...", "https://...", "https://..."],
  palette: {
    accent: "#3b82f6",
    accent2: "#93c5fd",
    ink: "#f8fafc",
    surface: "#080b10"
  },
  services: [
    ["Periyodik Bakım", "Doğrulanmış açıklama"],
    ["Mekanik", "Doğrulanmış açıklama"],
    ["Diagnostik", "Doğrulanmış açıklama"]
  ],
  highlights: ["...", "...", "..."],
  process: ["...", "...", "..."],
  faq: [{ q: "...", a: "..." }],
  contact: {
    phone: "+90...",
    whatsapp: "90...",
    address: "Doğrulanmış adres",
    maps: "https://...",
    instagram: "https://..."
  },
  seo: {
    title: "Ahmet Oto | ...",
    description: "..."
  }
}
```

## Sektör nasıl seçilir?

Preset’ler aynı dosyadaki `INDUSTRY_PRESETS` objesinde bulunur.

Mevcut preset’ler:

- `auto-service`
- `barber`
- `florist`
- `wedding`
- `renovation`
- `beauty`
- `restaurant`
- `real-estate`
- `technical-service`

Preset; varsayılan tasarım ailesini, CTA metinlerini ve bölüm sırasını belirler.

## Tasarım ailesi nasıl değiştirilir?

Mevcut aileler:

- `luxury`
- `industrial`
- `modern-local`
- `professional`

İşletmenin `family` değeri sektör preset’iyle uyumlu olmalıdır. Kontrat testi bu uyumu kontrol eder.

Hero çeşitleri:

- `split`
- `cinema`
- `editorial`
- `stack`

Bu sayede aynı altyapı kullanılırken bütün demolar aynı navbar + aynı hero + farklı renk şeklinde görünmez.

## Fotoğraf nasıl değiştirilir?

- Ana görsel: `heroImage`
- Galeri: `gallery`

Gerçek müşteri projesinde mümkünse optimize edilmiş WebP/AVIF dosyaları kendi CDN veya statik asset katmanından servis edilmelidir.

Demo sürümünde uzaktan görsel kullanılabilir; production müşteri sitesi için görsel lisansı ve kullanım hakkı ayrıca doğrulanmalıdır.

## WhatsApp nasıl eklenir?

`contact.whatsapp` içine ülke koduyla birlikte sadece kullanılabilir numarayı gir.

Örnek: `905551112233`

Numara yoksa sistem sahte numara üretmez. CTA demo modunda kalır ve kullanıcıya gerçek bilginin henüz eklenmediğini açıklar.

## Telefon ve yol tarifi nasıl eklenir?

- Telefon: `contact.phone`
- Google Maps / yol tarifi: `contact.maps`
- Adres: `contact.address`

Doğrulanmamış gerçek işletme bilgisi ekleme.

## SEO

Renderer işletmeye göre otomatik olarak:

- title
- meta description
- canonical
- OpenGraph title / description / image
- theme-color

üretir.

`verified: false` olan satış demolarında `WebPage` schema kullanılır.

`LocalBusiness` schema yalnızca işletme doğrulanmış ve temel iletişim/adres verileri mevcut olduğunda üretilir.

Demo shell ve Demo Hub `noindex,follow` kullanır; kurgusal veya doğrulanmamış demo verilerinin arama motorlarında gerçek işletme sayfası gibi indekslenmesi amaçlanmaz.

## Yeni sektör preset’i nasıl eklenir?

1. `INDUSTRY_PRESETS` içine yeni sektör ekle.
2. Tasarım ailesini seç.
3. 3 ana CTA belirle.
4. Bölüm sırasını belirle.
5. Renderer’da yeni, sektöre özel bir bölüm gerekiyorsa yalnızca o component’i ekle.
6. `npm run factory:test` çalıştır.

## Demo nasıl yayınlanır?

Mevcut Node sunucusu `public/` altındaki statik dosyaları doğrudan servis eder.

Bu nedenle deploy sonrası:

- `/website-factory.html`
- `/business-demo.html?business=lale-atelier`
- `/business-demo.html?business=ergin-auto`
- vb.

doğrudan çalışır.

## Geriye dönük uyumluluk

Şu mevcut URL’ler bu factory çalışmasında değiştirilmemiştir:

- `/berber-demo.html`
- `/beauty-demo.html`
- `/detailing-demo.html`

Müşteriye daha önce gönderilmiş bağlantılar bu değişiklikten etkilenmez.

## QA

Factory kontrat testi:

```bash
npm run factory:test
```

Test şunları kontrol eder:

- en az 10 demo config’i
- benzersiz slug
- geçerli sektör preset’i
- geçerli tasarım ailesi
- preset / family uyumu
- geçerli hero varyantı
- minimum hizmet / galeri / highlight sayısı
- SEO alanları
- doğrulanmamış işletmelerde sahte telefon/adres bulunmaması
- legacy demo URL dosyalarının korunması
- Factory JS dosyalarının syntax kontrolü

## Sonraki production adımı

Gerçek müşteri geldiğinde satış demosunu kopyalamak yerine mevcut config’i çoğaltıp **doğrulanmış işletme verisi + gerçek fotoğraflar** ile doldur. Gereksiz yeni component üretme; ancak sektörün dönüşüm akışı gerçekten farklıysa preset veya component katmanını genişlet.

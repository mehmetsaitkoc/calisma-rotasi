export const DESIGN_FAMILIES = {
  luxury: {
    label: "Luxury",
    description: "Editoryal tipografi, sinematik görseller ve sakin premium boşluklar."
  },
  industrial: {
    label: "Industrial",
    description: "Net hiyerarşi, teknik güven ve güçlü dönüşüm aksiyonları."
  },
  "modern-local": {
    label: "Modern Local",
    description: "Hızlı anlaşılır, sıcak ve mobilde aksiyon odaklı yerel işletme dili."
  },
  professional: {
    label: "Professional",
    description: "Kurumsal güven, sakin grid ve yüksek okunabilirlik."
  }
};

export const INDUSTRY_PRESETS = {
  "auto-service": {
    label: "Oto Servis",
    family: "industrial",
    ctas: ["WhatsApp’tan Fiyat Sor", "Hemen Ara", "Yol Tarifi"],
    sections: ["trust", "services", "process", "gallery", "faq", "contact"]
  },
  barber: {
    label: "Berber",
    family: "modern-local",
    ctas: ["Randevu Al", "WhatsApp", "Yol Tarifi"],
    sections: ["services", "pricing", "gallery", "team", "faq", "contact"]
  },
  florist: {
    label: "Çiçekçi / Atelier",
    family: "luxury",
    ctas: ["WhatsApp’tan Sipariş", "Koleksiyonu Gör", "Instagram"],
    sections: ["collections", "gallery", "services", "delivery", "faq", "contact"]
  },
  wedding: {
    label: "Düğün Salonu",
    family: "luxury",
    ctas: ["Tarihinizi Sorun", "Salonu Görmeye Gelin", "Teklif Al"],
    sections: ["venue", "gallery", "packages", "process", "faq", "contact"]
  },
  renovation: {
    label: "Tadilat / Dekorasyon",
    family: "industrial",
    ctas: ["Ücretsiz Keşif İste", "WhatsApp", "Hemen Ara"],
    sections: ["services", "beforeAfter", "projects", "process", "faq", "contact"]
  },
  beauty: {
    label: "Güzellik",
    family: "luxury",
    ctas: ["Randevu Sor", "Hizmetleri Gör", "WhatsApp"],
    sections: ["services", "gallery", "experience", "faq", "contact"]
  },
  restaurant: {
    label: "Cafe / Restoran",
    family: "modern-local",
    ctas: ["Menüyü Gör", "Rezervasyon Sor", "Yol Tarifi"],
    sections: ["menu", "gallery", "story", "hours", "faq", "contact"]
  },
  "real-estate": {
    label: "Gayrimenkul",
    family: "professional",
    ctas: ["Portföy Sor", "WhatsApp", "Danışmana Ulaş"],
    sections: ["services", "featured", "process", "areas", "faq", "contact"]
  },
  "technical-service": {
    label: "Teknik Servis",
    family: "industrial",
    ctas: ["Servis Talebi Oluştur", "Hemen Ara", "WhatsApp"],
    sections: ["services", "trust", "process", "areas", "faq", "contact"]
  }
};

const commonFaq = [
  {
    q: "Bu sayfadaki iletişim bilgileri gerçek mi?",
    a: "Hayır. Bu sürüm satış demosudur. İşletmenin doğrulanmış telefon, adres ve sosyal medya bilgileri eklendiğinde iletişim aksiyonları otomatik olarak gerçek bağlantılara dönüşür."
  },
  {
    q: "Site mobilde çalışıyor mu?",
    a: "Evet. Tasarım telefon öncelikli hazırlanır; WhatsApp, arama ve yol tarifi aksiyonları tek dokunuşla erişilecek şekilde konumlandırılır."
  },
  {
    q: "İçerikler işletmeye göre değiştirilebilir mi?",
    a: "Evet. İşletme adı, hizmetler, fotoğraflar, renkler, CTA metinleri ve SEO alanları kod kopyalamadan merkezi config üzerinden değiştirilebilir."
  }
];

const demoContact = {
  phone: "",
  whatsapp: "",
  address: "",
  maps: "",
  instagram: ""
};

export const BUSINESSES = {
  "lale-atelier": {
    slug: "lale-atelier",
    name: "Lale Atelier",
    eyebrow: "Çiçek • Tasarım • Özel Gün",
    industry: "florist",
    family: "luxury",
    heroVariant: "editorial",
    verified: false,
    demoNotice: "Lale Atelier için premium satış demosu — doğrulanmış işletme verileri henüz yüklenmedi.",
    tagline: "Her özel an için daha zarif bir ilk izlenim.",
    description: "Koleksiyonları güçlü görsellerle öne çıkaran, WhatsApp sipariş akışını merkeze alan premium florist deneyimi.",
    heroImage: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1494336934272-f7e1f3e52d83?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#9d6c72", accent2: "#d8b7a7", ink: "#241d1c", surface: "#f6f0ea" },
    services: [
      ["Özel Gün Buketleri", "Doğum günü, yıldönümü ve kutlama anları için demo koleksiyon yapısı."],
      ["Söz & Nişan Tasarımları", "Masa, karşılama ve çiçek tasarım seçkileri için premium sunum alanı."],
      ["Kurumsal Çiçek", "Ofis, açılış ve marka etkinlikleri için teklif akışı."]
    ],
    highlights: ["WhatsApp sipariş akışı", "Instagram odaklı görsel vitrin", "Teslimat bilgisini öne çıkaran yapı"],
    process: ["Tarzını seç", "Tarih ve teslimatı ilet", "Atelier önerisini al"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Lale Atelier — Premium Çiçekçi Web Sitesi Demo",
      description: "Çiçekçi ve atelier işletmeleri için premium, mobil öncelikli ve WhatsApp sipariş odaklı web sitesi demosu."
    }
  },

  "ergin-auto": {
    slug: "ergin-auto",
    name: "Ergin Auto",
    eyebrow: "Oto Servis • Bakım • Güven",
    industry: "auto-service",
    family: "industrial",
    heroVariant: "split",
    verified: false,
    demoNotice: "Ergin Auto için premium satış demosu — doğrulanmış hizmet, telefon ve adres bilgileri eklenmedi.",
    tagline: "Aracın için net hizmet. Karar vermen için net bilgi.",
    description: "Oto servis müşterisinin birkaç saniyede hizmeti anlamasını ve WhatsApp / arama aksiyonuna geçmesini sağlayan dönüşüm odaklı servis vitrini.",
    heroImage: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#45a6ff", accent2: "#98d4ff", ink: "#f4f7fb", surface: "#080b10" },
    services: [
      ["Periyodik Bakım", "Bakım hizmetlerini ve kapsamını sade şekilde gösterecek demo servis kartı."],
      ["Mekanik Kontrol", "Arıza tespiti ve mekanik servis için teklif aksiyonuna bağlanan alan."],
      ["Fren & Yürüyen Aksam", "Güvenlik odaklı servis kategorisi için örnek sunum."]
    ],
    highlights: ["Tek dokunuşla fiyat sor", "Servis türünü hızlı seç", "Mobilde sabit iletişim çubuğu"],
    process: ["Sorunu seç", "WhatsApp’tan detay gönder", "Servis planını netleştir"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Ergin Auto — Premium Oto Servis Web Sitesi Demo",
      description: "Oto servis işletmeleri için hızlı, güven veren ve WhatsApp teklif akışına odaklanan premium web sitesi demosu."
    }
  },

  "usta-oto-servis": {
    slug: "usta-oto-servis",
    name: "Usta Oto Servis",
    eyebrow: "Servis • Diagnostik • Bakım",
    industry: "auto-service",
    family: "industrial",
    heroVariant: "cinema",
    verified: false,
    demoNotice: "Usta Oto Servis için premium satış demosu — doğrulanmış işletme bilgileri eklenmedi.",
    tagline: "Sorunu anlat. Doğru servis adımını hızlıca gör.",
    description: "Güven unsurlarını, servis akışını ve teknik hizmetleri güçlü ilk ekranla sunan koyu premium servis deneyimi.",
    heroImage: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#ffb84d", accent2: "#ffd28f", ink: "#f7f4ef", surface: "#0c0c0d" },
    services: [
      ["Diagnostik Kontrol", "Arıza belirtisinden servis talebine giden örnek dönüşüm akışı."],
      ["Bakım Paketleri", "İşletme doğrulanmış paketlerini eklediğinde otomatik doldurulacak alan."],
      ["Elektrik & Mekanik", "Teknik hizmet gruplarını kategori bazlı sunan demo yapı."]
    ],
    highlights: ["Hizmeti hızlı bul", "Sorunu WhatsApp’tan gönder", "Yol tarifi ve arama hazır"],
    process: ["Belirtiyi seç", "Ön bilgi paylaş", "Uygun servis zamanını planla"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Usta Oto Servis — Premium Oto Servis Demo",
      description: "Oto servis ve teknik bakım işletmeleri için premium, mobil öncelikli web sitesi demosu."
    }
  },

  "premium-berber": {
    slug: "premium-berber",
    name: "Premium Berber",
    eyebrow: "Saç • Sakal • Bakım",
    industry: "barber",
    family: "modern-local",
    heroVariant: "stack",
    verified: false,
    demoNotice: "Berber sektörü için premium demo — işletmeye özel doğrulanmış bilgi içermez.",
    tagline: "Randevu almak, tarz seçmek kadar kolay olsun.",
    description: "Hizmet, fiyat ve çalışma görsellerini hızla gösteren; mobilde randevu aksiyonunu sürekli erişilebilir tutan berber vitrini.",
    heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1593702288056-f7b2b8b6bd4a?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#d8ad61", accent2: "#f0d39a", ink: "#f8f2e8", surface: "#0a0a0b" },
    services: [
      ["Saç Kesimi", "Fiyat ve süre bilgisi işletme config’inden yönetilebilen örnek hizmet."],
      ["Sakal Tasarımı", "Randevu CTA’sına bağlanan hizmet kartı."],
      ["Bakım Paketi", "İşletmenin gerçek paketleriyle değiştirilecek premium alan."]
    ],
    pricing: [["Saç Kesimi", "İşletme fiyatı eklenecek"], ["Sakal", "İşletme fiyatı eklenecek"], ["Paket", "İşletme fiyatı eklenecek"]],
    highlights: ["Randevu CTA’sı", "Çalışma galerisi", "Mobil sticky aksiyon"],
    team: ["Usta profili eklenebilir", "Uzmanlık alanı eklenebilir"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Premium Berber — Mobil Randevu Web Sitesi Demo",
      description: "Berber ve erkek kuaförleri için premium, mobil öncelikli ve randevu odaklı web sitesi demosu."
    }
  },

  "luna-davet": {
    slug: "luna-davet",
    name: "Luna Davet",
    eyebrow: "Düğün • Nişan • Davet",
    industry: "wedding",
    family: "luxury",
    heroVariant: "cinema",
    verified: false,
    demoNotice: "Kurgusal düğün salonu satış demosudur. Kapasite, fiyat ve yorum gibi gerçek işletme iddiaları içermez.",
    tagline: "İlk bakışta atmosferi hissettir. Sonra tarihi sordur.",
    description: "Düğün salonları için sinematik ilk ekran, güçlü galeri ve doğrudan tarih / teklif aksiyonu üzerine kurulu premium satış sayfası.",
    heroImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#c7a66b", accent2: "#ead7aa", ink: "#fffaf1", surface: "#15110f" },
    services: [
      ["Düğün Organizasyonu", "Salon deneyimini galeri ve teklif akışıyla birlikte sunan demo bölüm."],
      ["Nişan & Söz", "Farklı organizasyon türleri için ayrı CTA kurgusu."],
      ["Kurumsal Davet", "Etkinlik taleplerinin hızlıca toplanabildiği alan."]
    ],
    highlights: ["Sinematik galeri", "Tarih sor CTA’sı", "Salon özellikleri için modüler alan"],
    process: ["Tarihini ilet", "Salon seçeneklerini gör", "Teklif ve ziyaret planını al"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Luna Davet — Düğün Salonu Web Sitesi Demo",
      description: "Düğün salonları için sinematik, galeri odaklı ve teklif toplamaya uygun premium web sitesi demosu."
    }
  },

  "form-renovasyon": {
    slug: "form-renovasyon",
    name: "Form Renovasyon",
    eyebrow: "Tadilat • Dekorasyon • Uygulama",
    industry: "renovation",
    family: "industrial",
    heroVariant: "editorial",
    verified: false,
    demoNotice: "Kurgusal tadilat firması satış demosudur. Proje sayısı, süre ve başarı iddiaları gerçek veri değildir.",
    tagline: "Önce sonucu göster. Sonra ücretsiz keşfe davet et.",
    description: "Tadilat müşterisinin görmek istediği şeyleri öne alan: öncesi/sonrası, süreç, proje galerisi ve hızlı keşif talebi.",
    heroImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#f08c46", accent2: "#ffc395", ink: "#f8f5f0", surface: "#11100e" },
    services: [
      ["Anahtar Teslim Tadilat", "İşletmenin gerçek kapsamı eklendiğinde hizmet akışına dönüşen demo kartı."],
      ["Mutfak & Banyo", "Öncesi / sonrası görselleriyle birlikte sunulabilecek kategori."],
      ["İç Mekân Uygulama", "Keşif CTA’sına bağlanan proje türü."]
    ],
    beforeAfter: [
      ["Önce", "Proje öncesi görsel alanı"],
      ["Sonra", "Tamamlanan proje görsel alanı"]
    ],
    highlights: ["Ücretsiz keşif CTA’sı", "Öncesi / sonrası modülü", "Proje odaklı galeri"],
    process: ["İhtiyacını anlat", "Keşif planla", "Kapsamı ve uygulamayı netleştir"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Form Renovasyon — Tadilat Web Sitesi Demo",
      description: "Tadilat ve dekorasyon firmaları için proje, öncesi/sonrası ve ücretsiz keşif odaklı premium web sitesi demosu."
    }
  },

  "maison-beauty": {
    slug: "maison-beauty",
    name: "Maison Beauty",
    eyebrow: "Bakım • Estetik Deneyim • Randevu",
    industry: "beauty",
    family: "luxury",
    heroVariant: "split",
    verified: false,
    demoNotice: "Kurgusal güzellik merkezi satış demosudur. Sağlık veya sonuç garantisi iddiası içermez.",
    tagline: "Sakin, temiz, güven veren bir randevu deneyimi.",
    description: "Hizmetleri premium görsel dilde sunan; sonuç garantisi gibi sağlık iddiaları kullanmadan randevuya yönlendiren mobil deneyim.",
    heroImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#b98f79", accent2: "#e6cfc0", ink: "#2d2420", surface: "#fbf7f3" },
    services: [
      ["Cilt Bakım Ritüeli", "İşletmenin gerçek hizmet kapsamı ile değiştirilecek demo kategori."],
      ["Kaş & Kirpik", "Randevu CTA’sına bağlanan görsel hizmet alanı."],
      ["El & Tırnak Bakımı", "Fiyat ve süre alanı config üzerinden eklenebilir."]
    ],
    highlights: ["Sakin premium tipografi", "Randevu akışı", "Sağlık iddiası içermeyen içerik yapısı"],
    process: ["Hizmeti seç", "Uygun zamanı sor", "Randevunu netleştir"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Maison Beauty — Güzellik Merkezi Web Sitesi Demo",
      description: "Güzellik merkezleri için premium, sakin ve mobil randevu odaklı web sitesi demosu."
    }
  },

  "rota-cafe": {
    slug: "rota-cafe",
    name: "Rota Coffee House",
    eyebrow: "Coffee • Brunch • Local",
    industry: "restaurant",
    family: "modern-local",
    heroVariant: "editorial",
    verified: false,
    demoNotice: "Kurgusal cafe satış demosudur. Menü, fiyat, çalışma saati ve adres bilgileri gerçek değildir.",
    tagline: "Mekânın hissini telefonda kaybetmeden anlat.",
    description: "Menü, atmosfer, çalışma saatleri ve yol tarifi gibi yerel cafe müşterisinin aradığı bilgileri hızla sunan sıcak web deneyimi.",
    heroImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#b86c3d", accent2: "#e4b087", ink: "#2c211b", surface: "#f4ede3" },
    services: [
      ["Kahve Seçkisi", "Menü kategorilerini görsel kartlarla sunan demo alan."],
      ["Brunch", "İşletmenin gerçek ürünleri ve fiyatları eklendiğinde otomatik dolacak kategori."],
      ["Take Away", "Hızlı sipariş veya WhatsApp bağlantısı için hazır CTA alanı."]
    ],
    menu: [["Espresso Bar", "Demo kategori"], ["Brunch", "Demo kategori"], ["Tatlılar", "Demo kategori"]],
    highlights: ["Menüye hızlı erişim", "Yol tarifi CTA’sı", "Atmosfer odaklı galeri"],
    process: ["Menüye göz at", "Saatleri kontrol et", "Yol tarifini aç"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Rota Coffee House — Cafe Web Sitesi Demo",
      description: "Cafe ve restoranlar için menü, atmosfer ve yol tarifi odaklı modern mobil web sitesi demosu."
    }
  },

  "mersin-select": {
    slug: "mersin-select",
    name: "Mersin Select Gayrimenkul",
    eyebrow: "Konut • Yatırım • Danışmanlık",
    industry: "real-estate",
    family: "professional",
    heroVariant: "split",
    verified: false,
    demoNotice: "Kurgusal gayrimenkul satış demosudur. Portföy, fiyat ve yatırım getirisi iddiası içermez.",
    tagline: "Portföy kalitesini sakin ve güvenilir bir sunumla göster.",
    description: "Gayrimenkul işletmeleri için portföy kategorileri, bölge uzmanlığı ve danışmana hızlı ulaşma akışını bir araya getiren profesyonel deneyim.",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#2f5a83", accent2: "#8aa8c2", ink: "#102233", surface: "#f5f7f8" },
    services: [
      ["Satılık Konut", "Gerçek portföy kaynağı bağlandığında ilan kartlarına dönüşebilecek kategori."],
      ["Kiralık Konut", "Bölge ve oda tipi filtreleri için hazır modüler alan."],
      ["Yatırım Danışmanlığı", "Kesin getiri iddiası kullanmadan danışmanlık iletişimine yönlendiren CTA."]
    ],
    highlights: ["Kurumsal güven dili", "Portföy kategorileri", "Danışmana hızlı ulaşım"],
    process: ["İhtiyacını belirt", "Uygun portföyü daralt", "Görüşme planla"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Mersin Select Gayrimenkul — Emlak Web Sitesi Demo",
      description: "Gayrimenkul ve emlak ofisleri için profesyonel, portföy ve danışman iletişimi odaklı web sitesi demosu."
    }
  },

  "klima-pro": {
    slug: "klima-pro",
    name: "Klima Pro Teknik",
    eyebrow: "Klima • Bakım • Teknik Servis",
    industry: "technical-service",
    family: "industrial",
    heroVariant: "stack",
    verified: false,
    demoNotice: "Kurgusal teknik servis satış demosudur. Yetki, servis bölgesi ve fiyat bilgileri gerçek değildir.",
    tagline: "Servis ihtiyacını uzatmadan doğru aksiyona götür.",
    description: "Teknik servis müşterisi için hizmet türü, servis talebi, bölge bilgisi ve tek dokunuşla arama/WhatsApp akışını öne çıkaran hızlı yapı.",
    heroImage: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1800&q=88",
    gallery: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1100&q=84",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1100&q=84"
    ],
    palette: { accent: "#27a9e1", accent2: "#8bdcff", ink: "#f6fbff", surface: "#071116" },
    services: [
      ["Klima Bakımı", "Periyodik bakım talebini tek dokunuşla başlatan örnek hizmet."],
      ["Arıza Servisi", "Sorun tipini seçip iletişim kanalına taşıyan demo akış."],
      ["Montaj Talebi", "Bölge ve cihaz bilgisiyle teklif toplamaya uygun kategori."]
    ],
    highlights: ["Tek dokunuşla servis talebi", "Bölge bazlı içerik", "Telefon + WhatsApp sticky CTA"],
    process: ["Hizmeti seç", "Cihaz ve bölge bilgisini ilet", "Servis zamanını netleştir"],
    faq: commonFaq,
    contact: demoContact,
    seo: {
      title: "Klima Pro Teknik — Teknik Servis Web Sitesi Demo",
      description: "Klima ve teknik servis işletmeleri için hızlı, mobil öncelikli ve servis talebi odaklı premium web sitesi demosu."
    }
  }
};

export function listBusinesses() {
  return Object.values(BUSINESSES);
}

export function getBusiness(slug) {
  return BUSINESSES[slug] || null;
}

export function getPreset(industry) {
  return INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS["technical-service"];
}

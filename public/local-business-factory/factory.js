import { getBusiness, getPreset } from "./businesses.js";

const app = document.querySelector("#factory-app");
const params = new URLSearchParams(window.location.search);
const slug = params.get("business") || document.body.dataset.business || "";
const business = getBusiness(slug);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.origin);
    if (["http:", "https:", "tel:", "mailto:"].includes(url.protocol)) return raw;
  } catch {}
  return "";
}

function phoneHref(phone = "") {
  const normalized = String(phone).replace(/[^+\d]/g, "");
  return normalized ? "tel:" + normalized : "";
}

function whatsappHref(phone = "", message = "") {
  const normalized = String(phone).replace(/\D/g, "");
  if (!normalized) return "";
  return "https://wa.me/" + normalized + "?text=" + encodeURIComponent(message);
}

function createMeta(name, content, property = false) {
  if (!content) return;
  const selector = property ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setCanonical(url) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.rel = "canonical";
    document.head.appendChild(node);
  }
  node.href = url;
}

function setStructuredData(item) {
  const old = document.head.querySelector("#factory-structured-data");
  if (old) old.remove();
  const script = document.createElement("script");
  script.id = "factory-structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(item);
  document.head.appendChild(script);
}

function applySeo(item) {
  document.title = item.seo?.title || item.name + " — Web Sitesi Demo";
  createMeta("description", item.seo?.description || item.description);
  createMeta("theme-color", item.palette?.surface || "#ffffff");
  createMeta("robots", item.verified ? "index,follow" : "noindex,follow");
  createMeta("og:title", document.title, true);
  createMeta("og:description", item.seo?.description || item.description, true);
  createMeta("og:type", "website", true);
  createMeta("og:image", item.heroImage, true);
  createMeta("twitter:card", "summary_large_image");
  const canonical = new URL("./business-demo.html?business=" + encodeURIComponent(item.slug), window.location.href).href;
  setCanonical(canonical);
  createMeta("og:url", canonical, true);

  const schema = item.verified && item.contact?.phone && item.contact?.address
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: item.name,
        telephone: item.contact.phone,
        address: item.contact.address,
        image: item.heroImage,
        url: canonical
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: document.title,
        description: item.seo?.description || item.description,
        url: canonical,
        primaryImageOfPage: item.heroImage
      };
  setStructuredData(schema);
}

function applyTheme(item) {
  const root = document.documentElement;
  if (item.palette?.accent) root.style.setProperty("--factory-accent", item.palette.accent);
  if (item.palette?.accent2) root.style.setProperty("--factory-accent-2", item.palette.accent2);
  if (item.palette?.ink) root.style.setProperty("--factory-ink", item.palette.ink);
  if (item.palette?.surface) root.style.setProperty("--factory-bg", item.palette.surface);
  document.body.classList.add("factory-page", "family-" + item.family);
}

function actionFor(label, item) {
  const lower = String(label).toLocaleLowerCase("tr-TR");
  const phone = item.contact?.phone || "";
  const whatsapp = item.contact?.whatsapp || phone;
  const message = item.name + " web sitesinden bilgi almak istiyorum.";

  if (lower.includes("yol") || lower.includes("harita")) {
    const href = safeUrl(item.contact?.maps);
    return href ? { href, external: true } : { href: "#contact", demo: true };
  }
  if (lower.includes("instagram")) {
    const href = safeUrl(item.contact?.instagram);
    return href ? { href, external: true } : { href: "#contact", demo: true };
  }
  if (lower.includes("ara") && !lower.includes("sor")) {
    const href = phoneHref(phone);
    return href ? { href } : { href: "#contact", demo: true };
  }
  if (
    lower.includes("whatsapp") ||
    lower.includes("randevu") ||
    lower.includes("teklif") ||
    lower.includes("tarih") ||
    lower.includes("sipariş") ||
    lower.includes("keşif") ||
    lower.includes("servis") ||
    lower.includes("danışman")
  ) {
    const href = whatsappHref(whatsapp, message);
    return href ? { href, external: true } : { href: "#contact", demo: true };
  }
  if (lower.includes("menü")) return { href: "#menu" };
  if (lower.includes("koleksiyon")) return { href: "#offers" };
  if (lower.includes("hizmet")) return { href: "#offers" };
  return { href: "#contact" };
}

function button(label, item, kind = "primary") {
  const action = actionFor(label, item);
  const attrs = [];
  if (action.external) attrs.push('target="_blank"', 'rel="noopener noreferrer"');
  if (action.demo) attrs.push('data-demo-action="' + escapeHtml(label) + '"', 'aria-disabled="true"');
  return '<a class="factory-button factory-button--' + kind + '" href="' + escapeHtml(action.href) + '" ' + attrs.join(" ") + '>' + escapeHtml(label) + "</a>";
}

function nav(item, preset) {
  return (
    '<header class="factory-nav" id="factory-nav">' +
      '<div class="factory-wrap factory-nav__inner">' +
        '<a class="factory-brand" href="#top" aria-label="' + escapeHtml(item.name) + ' ana bölüm">' +
          '<span class="factory-brand__mark" aria-hidden="true">' + escapeHtml(item.name.slice(0, 1)) + "</span>" +
          '<span class="factory-brand__text">' +
            '<span class="factory-brand__name">' + escapeHtml(item.name) + "</span>" +
            '<span class="factory-brand__eyebrow">' + escapeHtml(preset.label) + " • " + escapeHtml(item.eyebrow) + "</span>" +
          "</span>" +
        "</a>" +
        '<nav class="factory-nav__links" aria-label="Bölümler">' +
          '<a href="#offers">Hizmetler</a>' +
          '<a href="#gallery">Galeri</a>' +
          '<a href="#process">Süreç</a>' +
          '<a href="#contact">İletişim</a>' +
        "</nav>" +
        '<div class="factory-nav__actions">' +
          button(preset.ctas[1], item, "ghost") +
          button(preset.ctas[0], item, "primary") +
        "</div>" +
        '<button class="factory-menu" id="factory-menu" type="button" aria-label="Menüyü aç" aria-expanded="false">☰</button>' +
      "</div>" +
    "</header>"
  );
}

function demoNote(item) {
  if (item.verified) return "";
  return (
    '<div class="factory-demo-note">' +
      '<div class="factory-wrap factory-demo-note__inner">' +
        '<span class="factory-demo-note__badge">Demo</span>' +
        '<span>' + escapeHtml(item.demoNotice || "Bu sayfa satış demosudur.") + "</span>" +
      "</div>" +
    "</div>"
  );
}

function hero(item, preset) {
  const highlights = (item.highlights || []).slice(0, 3);
  return (
    '<section class="factory-hero factory-hero--' + escapeHtml(item.heroVariant || "split") + '" id="top">' +
      '<div class="factory-hero__media" style="background-image:url(&quot;' + escapeHtml(item.heroImage) + '&quot;)" role="img" aria-label="' + escapeHtml(item.name + " demo hero görseli") + '"></div>' +
      '<div class="factory-hero__veil"></div>' +
      '<div class="factory-wrap factory-hero__content">' +
        '<div class="factory-hero__grid">' +
          "<div>" +
            '<div class="factory-kicker">' + escapeHtml(item.eyebrow) + "</div>" +
            "<h1>" + escapeHtml(item.tagline) + "</h1>" +
            '<p class="factory-hero__lead">' + escapeHtml(item.description) + "</p>" +
            '<div class="factory-hero__actions">' +
              button(preset.ctas[0], item, "primary") +
              button(preset.ctas[1], item, "ghost") +
              button(preset.ctas[2], item, "ghost") +
            "</div>" +
          "</div>" +
          '<aside class="factory-hero__aside" aria-label="Öne çıkanlar">' +
            "<strong>Hızlı karar için doğru bilgiler.</strong>" +
            "<p>İlk ekranda ne yapıldığı, güven unsuru ve sonraki aksiyon netleşir.</p>" +
            '<div class="factory-hero__aside-list">' +
              highlights.map((text) => '<div class="factory-hero__aside-item">' + escapeHtml(text) + "</div>").join("") +
            "</div>" +
          "</aside>" +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function sectionHead(label, title, intro = "") {
  return (
    '<div class="factory-section__head">' +
      "<div>" +
        '<div class="factory-section__label">' + escapeHtml(label) + "</div>" +
        "<h2>" + escapeHtml(title) + "</h2>" +
      "</div>" +
      (intro ? '<p class="factory-section__intro">' + escapeHtml(intro) + "</p>" : "<div></div>") +
    "</div>"
  );
}

function renderTrust(item) {
  const items = (item.highlights || []).slice(0, 3);
  if (!items.length) return "";
  return (
    '<section class="factory-section factory-section--tight" id="trust">' +
      '<div class="factory-wrap">' +
        '<div class="factory-trust">' +
          items.map((text, index) =>
            '<div class="factory-trust__item">' +
              '<div class="factory-trust__number">0' + (index + 1) + "</div>" +
              '<div class="factory-trust__text">' + escapeHtml(text) + "</div>" +
            "</div>"
          ).join("") +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderOffers(item, label = "Hizmetler", title = "Müşterinin aradığı hizmeti hızlıca buldur.", intro = "") {
  const items = item.services || [];
  if (!items.length) return "";
  return (
    '<section class="factory-section" id="offers">' +
      '<div class="factory-wrap">' +
        sectionHead(label, title, intro || "Hizmet kartları işletme config’inden yönetilir; yeni müşteri eklerken component kopyalamak gerekmez.") +
        '<div class="factory-grid">' +
          items.map((service, index) =>
            '<article class="factory-card">' +
              '<div class="factory-card__index">0' + (index + 1) + "</div>" +
              "<h3>" + escapeHtml(service[0]) + "</h3>" +
              "<p>" + escapeHtml(service[1]) + "</p>" +
              '<div class="factory-card__footer">Detay / teklif akışına bağlanır →</div>' +
            "</article>"
          ).join("") +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderGallery(item, label = "Galeri", title = "İşi anlatmak yerine göster.") {
  const images = (item.gallery || []).slice(0, 3);
  if (!images.length) return "";
  return (
    '<section class="factory-section" id="gallery">' +
      '<div class="factory-wrap">' +
        sectionHead(label, title, "Gerçek müşteri fotoğrafları eklendiğinde aynı yapı otomatik olarak işletmenin dijital vitrinine dönüşür.") +
        '<div class="factory-gallery">' +
          '<div class="factory-gallery__main">' +
            '<figure><img src="' + escapeHtml(images[0]) + '" width="1200" height="900" loading="lazy" decoding="async" alt="' + escapeHtml(item.name + " demo galeri görseli 1") + '"></figure>' +
          "</div>" +
          '<div class="factory-gallery__side">' +
            images.slice(1).map((image, index) =>
              '<figure><img src="' + escapeHtml(image) + '" width="900" height="600" loading="lazy" decoding="async" alt="' + escapeHtml(item.name + " demo galeri görseli " + (index + 2)) + '"></figure>'
            ).join("") +
          "</div>" +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderProcess(item) {
  const steps = item.process || [];
  if (!steps.length) return "";
  return (
    '<section class="factory-section" id="process">' +
      '<div class="factory-wrap">' +
        sectionHead("Süreç", "Müşteriyi gereksiz formda kaybetme.", "Yerel işletmede amaç hızlı güven ve hızlı aksiyon: WhatsApp, telefon, yol tarifi veya teklif.") +
        '<div class="factory-process">' +
          steps.map((step, index) =>
            '<div class="factory-process__step">' +
              "<span>ADIM 0" + (index + 1) + "</span>" +
              "<strong>" + escapeHtml(step) + "</strong>" +
              "<p>Bu adım sektör preset’i üzerinden değiştirilebilir.</p>" +
            "</div>"
          ).join("") +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderListSection(item, id, label, title, rows) {
  if (!rows || !rows.length) return "";
  return (
    '<section class="factory-section" id="' + escapeHtml(id) + '">' +
      '<div class="factory-wrap">' +
        sectionHead(label, title, "Bu alan config verisiyle otomatik doldurulur.") +
        '<div class="factory-list">' +
          rows.map((row) =>
            '<div class="factory-list__item"><strong>' + escapeHtml(row[0]) + '</strong><span>' + escapeHtml(row[1]) + "</span></div>"
          ).join("") +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderContextBlock(item, key) {
  const map = {
    delivery: ["Teslimat", "Sipariş deneyimindeki belirsizliği azalt.", "Teslimat bölgesi, aynı gün seçeneği ve minimum sipariş gibi doğrulanmış bilgiler burada gösterilebilir."],
    venue: ["Salon", "Atmosferi ve organizasyon seçeneklerini tek bakışta anlat.", "Kapasite, salon tipi ve organizasyon detayları yalnızca doğrulanmış veri geldiğinde yayınlanır."],
    packages: ["Organizasyon", "Teklif istemeyi kolaylaştır.", "Paket içerikleri ve fiyatlar doğrulanmış işletme bilgileriyle config üzerinden eklenir."],
    experience: ["Deneyim", "Randevu öncesi güven duygusunu güçlendir.", "Salon yaklaşımı, hijyen ve hizmet akışı gibi doğrulanmış bilgiler bu alana eklenebilir."],
    story: ["Mekân", "Marka hissini menünün önüne değil, kararın yanına koy.", "Kısa hikâye, mutfak yaklaşımı ve mekân karakteri mobilde kolay okunur tutulur."],
    hours: ["Saatler", "Açık mı, nerede, nasıl ulaşırım?", "Çalışma saatleri doğrulandığında bu bölüm Google’dan gelen kullanıcıya hızlı cevap verir."],
    areas: ["Hizmet Alanı", "Kime ve hangi bölgede hizmet verildiğini netleştir.", "Bölge isimleri doğrulanmış veriyle eklendiğinde yerel SEO ve dönüşüm akışını destekler."],
    featured: ["Öne Çıkanlar", "Portföy veya proje seçkisini temiz bir grid ile sun.", "Gerçek portföy verisi geldiğinde kartlar görsel, bölge ve temel bilgilerle doldurulur."],
    projects: ["Projeler", "Tamamlanan işleri güçlü görsel kanıt olarak kullan.", "Gerçek proje görselleri eklendiğinde demo galerisi otomatik olarak müşteri portföyüne dönüşür."]
  };
  const data = map[key];
  if (!data) return "";
  const cards = (item.highlights || []).slice(0, 3).map((text, index) =>
    '<article class="factory-card">' +
      '<div class="factory-card__index">0' + (index + 1) + "</div>" +
      "<h3>" + escapeHtml(text) + "</h3>" +
      "<p>" + escapeHtml(data[2]) + "</p>" +
    "</article>"
  ).join("");
  return (
    '<section class="factory-section" id="' + escapeHtml(key) + '">' +
      '<div class="factory-wrap">' +
        sectionHead(data[0], data[1], data[2]) +
        '<div class="factory-grid">' + cards + "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderBeforeAfter(item) {
  const rows = item.beforeAfter || [];
  if (!rows.length) return "";
  return renderListSection(item, "before-after", "Öncesi / Sonrası", "Sonucu yan yana göster.", rows);
}

function renderFaq(item) {
  const items = item.faq || [];
  if (!items.length) return "";
  return (
    '<section class="factory-section" id="faq">' +
      '<div class="factory-wrap">' +
        sectionHead("SSS", "Karar öncesi son soru işaretlerini kaldır.", "İşletmeye özel sorular config içinden değiştirilebilir.") +
        '<div class="factory-faq">' +
          items.map((entry) =>
            "<details><summary>" + escapeHtml(entry.q) + "</summary><p>" + escapeHtml(entry.a) + "</p></details>"
          ).join("") +
        "</div>" +
      "</div>" +
    "</section>"
  );
}

function renderContact(item, preset) {
  const c = item.contact || {};
  const hasRealContact = Boolean(c.phone || c.whatsapp || c.address || c.maps || c.instagram);
  return (
    '<section class="factory-section" id="contact">' +
      '<div class="factory-wrap factory-contact">' +
        "<div>" +
          '<div class="factory-section__label">İletişim</div>' +
          "<h2>" + escapeHtml(hasRealContact ? "Hazırsan doğrudan iletişime geç." : "Müşteri bilgileri girildiğinde CTA’lar gerçek bağlantıya dönüşür.") + "</h2>" +
          '<p class="factory-section__intro" style="margin-top:18px">' +
            escapeHtml(hasRealContact
              ? "Telefon, WhatsApp, adres ve yol tarifi tek noktada."
              : "Bu demo doğrulanmamış telefon veya adres uydurmaz. Factory config’ine gerçek bilgi eklendiğinde tüm aksiyonlar otomatik çalışır.") +
          "</p>" +
        "</div>" +
        '<aside class="factory-contact__panel">' +
          "<h3>" + escapeHtml(item.name) + "</h3>" +
          "<p>" + escapeHtml(item.eyebrow) + "</p>" +
          '<div class="factory-contact__actions">' +
            button(preset.ctas[0], item, "primary") +
            button(preset.ctas[1], item, "ghost") +
            button(preset.ctas[2], item, "ghost") +
          "</div>" +
          '<div class="factory-contact__meta">' +
            '<div><strong>Telefon:</strong> ' + escapeHtml(c.phone || "Doğrulanmış telefon eklenecek") + "</div>" +
            '<div><strong>Adres:</strong> ' + escapeHtml(c.address || "Doğrulanmış adres eklenecek") + "</div>" +
          "</div>" +
        "</aside>" +
      "</div>" +
    "</section>"
  );
}

function renderSection(key, item, preset) {
  switch (key) {
    case "trust":
      return renderTrust(item);
    case "services":
      return renderOffers(item);
    case "collections":
      return renderOffers(item, "Koleksiyonlar", "Görsel seçkiyi satın alma niyetine bağla.");
    case "gallery":
      return renderGallery(item);
    case "process":
      return renderProcess(item);
    case "pricing":
      return renderListSection(item, "pricing", "Fiyatlar", "Şeffaf fiyat alanı.", item.pricing || []);
    case "team":
      return renderListSection(
        item,
        "team",
        "Ekip",
        "İşletmenin insan yüzünü göster.",
        (item.team || []).map((value) => [value, "Doğrulanmış ekip bilgisiyle güncellenir"])
      );
    case "menu":
      return renderListSection(item, "menu", "Menü", "Kategorilere hızlı göz at.", item.menu || []);
    case "beforeAfter":
      return renderBeforeAfter(item);
    case "faq":
      return renderFaq(item);
    case "contact":
      return renderContact(item, preset);
    default:
      return renderContextBlock(item, key);
  }
}

function footer(item) {
  return (
    '<footer class="factory-footer">' +
      '<div class="factory-wrap factory-footer__inner">' +
        "<div>" +
          '<div class="factory-footer__brand">' + escapeHtml(item.name) + "</div>" +
          '<div>Local Business Website Factory • ' + (item.verified ? "Doğrulanmış işletme verisi" : "Satış demosu") + "</div>" +
        "</div>" +
        '<div><a href="./website-factory.html">Tüm demo modellerini gör</a></div>' +
      "</div>" +
    "</footer>"
  );
}

function sticky(item, preset) {
  return (
    '<div class="factory-sticky" aria-label="Hızlı iletişim">' +
      '<div class="factory-sticky__inner">' +
        button(preset.ctas[1], item, "ghost") +
        button(preset.ctas[0], item, "primary") +
      "</div>" +
    "</div>"
  );
}

function toast() {
  return '<div class="factory-toast" id="factory-toast" role="status" aria-live="polite"></div>';
}

function wireInteractions() {
  const menu = document.querySelector("#factory-menu");
  const navNode = document.querySelector("#factory-nav");
  if (menu && navNode) {
    menu.addEventListener("click", () => {
      const open = navNode.classList.toggle("is-open");
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    });
    navNode.querySelectorAll(".factory-nav__links a").forEach((link) => {
      link.addEventListener("click", () => {
        navNode.classList.remove("is-open");
        menu.setAttribute("aria-expanded", "false");
      });
    });
  }

  const toastNode = document.querySelector("#factory-toast");
  let toastTimer;
  document.querySelectorAll("[data-demo-action]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      const label = node.getAttribute("data-demo-action") || "İletişim";
      if (!toastNode) return;
      toastNode.textContent = label + ": gerçek işletme telefonu / WhatsApp bilgisi eklendiğinde bu aksiyon doğrudan çalışacak.";
      toastNode.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastNode.classList.remove("is-visible"), 4200);
      document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

if (!business) {
  document.body.classList.add("factory-page");
  app.innerHTML =
    '<main class="factory-empty factory-wrap">' +
      "<h1>Demo bulunamadı.</h1>" +
      "<p>Geçerli bir Website Factory işletme anahtarı seçin.</p>" +
      '<p><a href="/website-factory.html">Demo Hub’a dön</a></p>' +
    "</main>";
} else {
  const preset = getPreset(business.industry);
  applyTheme(business);
  applySeo(business);

  const sections = preset.sections
    .map((key) => renderSection(key, business, preset))
    .filter(Boolean)
    .join("");

  app.innerHTML =
    '<div class="factory-shell">' +
      nav(business, preset) +
      demoNote(business) +
      "<main>" +
        hero(business, preset) +
        sections +
      "</main>" +
      footer(business) +
      sticky(business, preset) +
      toast() +
    "</div>";

  wireInteractions();
}

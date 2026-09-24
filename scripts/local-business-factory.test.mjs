import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUSINESSES,
  DESIGN_FAMILIES,
  INDUSTRY_PRESETS,
  getPreset
} from "../public/local-business-factory/businesses.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const businessEntries = Object.entries(BUSINESSES);
assert.ok(businessEntries.length >= 10, "Factory en az 10 demo işletme içermeli.");

const allowedHeroVariants = new Set(["split", "cinema", "editorial", "stack"]);
const slugs = new Set();

for (const [key, business] of businessEntries) {
  assert.equal(key, business.slug, key + ": config anahtarı ve slug aynı olmalı.");
  assert.ok(!slugs.has(business.slug), business.slug + ": duplicate slug.");
  slugs.add(business.slug);

  assert.ok(INDUSTRY_PRESETS[business.industry], business.slug + ": bilinmeyen industry preset.");
  assert.ok(DESIGN_FAMILIES[business.family], business.slug + ": bilinmeyen design family.");
  assert.equal(getPreset(business.industry).family, business.family, business.slug + ": preset/family uyumsuz.");
  assert.ok(allowedHeroVariants.has(business.heroVariant), business.slug + ": geçersiz hero variant.");
  assert.ok(/^https:\/\//.test(business.heroImage), business.slug + ": hero image HTTPS olmalı.");
  assert.ok(Array.isArray(business.gallery) && business.gallery.length >= 3, business.slug + ": en az 3 galeri görseli gerekli.");
  assert.ok(Array.isArray(business.services) && business.services.length >= 3, business.slug + ": en az 3 hizmet gerekli.");
  assert.ok(Array.isArray(business.highlights) && business.highlights.length >= 3, business.slug + ": en az 3 highlight gerekli.");
  assert.ok(Array.isArray(business.faq) && business.faq.length >= 3, business.slug + ": SSS gerekli.");
  assert.ok(business.seo?.title && business.seo?.description, business.slug + ": SEO title/description gerekli.");

  if (!business.verified) {
    const contact = business.contact || {};
    for (const field of ["phone", "whatsapp", "address", "maps", "instagram"]) {
      assert.equal(contact[field] || "", "", business.slug + ": doğrulanmamış işletmede " + field + " uydurulmamalı.");
    }
    assert.ok(/demo/i.test(business.demoNotice || ""), business.slug + ": demo uyarısı görünür olmalı.");
  }
}

for (const [industry, preset] of Object.entries(INDUSTRY_PRESETS)) {
  assert.ok(DESIGN_FAMILIES[preset.family], industry + ": preset family bulunamadı.");
  assert.equal(preset.ctas.length, 3, industry + ": 3 CTA tanımlı olmalı.");
  assert.ok(preset.sections.includes("contact"), industry + ": contact bölümü zorunlu.");
}

const businessShell = fs.readFileSync(path.join(root, "public", "business-demo.html"), "utf8");
assert.match(businessShell, /local-business-factory\/factory\.css/);
assert.match(businessShell, /local-business-factory\/factory\.js/);

const hub = fs.readFileSync(path.join(root, "public", "website-factory.html"), "utf8");
assert.match(hub, /local-business-factory\/hub\.css/);
assert.match(hub, /local-business-factory\/hub\.js/);
assert.match(hub, /berber-demo\.html/);
assert.match(hub, /beauty-demo\.html/);
assert.match(hub, /detailing-demo\.html/);

for (const legacy of ["berber-demo.html", "beauty-demo.html", "detailing-demo.html"]) {
  assert.ok(fs.existsSync(path.join(root, "public", legacy)), "Legacy demo korunmalı: " + legacy);
}

for (const jsFile of [
  "public/local-business-factory/businesses.js",
  "public/local-business-factory/factory.js",
  "public/local-business-factory/hub.js"
]) {
  execFileSync(process.execPath, ["--check", path.join(root, jsFile)], { stdio: "pipe" });
}

console.log(
  "Local Business Website Factory contracts OK:",
  businessEntries.length,
  "businesses,",
  Object.keys(INDUSTRY_PRESETS).length,
  "industry presets,",
  Object.keys(DESIGN_FAMILIES).length,
  "design families."
);

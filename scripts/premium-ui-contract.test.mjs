import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

for(const marker of [
  'PREMIUM PRODUCT PASS V1',
  'PREMIUM UI V2 · LIVING INTERFACE',
  '/premium-v2.css',
  'akıllı çalışma sistemi',
  'route-progress-orb',
  'coach-avatar-mini',
  'ROTA HOCA · GÜNLÜK BRİF',
  'teacher-context-pod',
  'BUGÜNKÜ ÇALIŞMA BAĞLAMI',
  'v2-insight-preview',
  '--v2-violet:#6c63ff',
  '--v2-cyan:#25c8c4',
  '.route-task:not(.is-done):first-child',
  '.mobile-dock{',
  'PREMIUM EXPERIENCE COMPONENTS V1',
  'data-premium-surface="welcome"',
  'welcome-live-console',
  'ROTA MOTORU',
  'VERİ',
  'KARAR',
  'GÖREV',
  'welcome-choice-head',
  'route-command-status',
  'ROTA GÜNCEL',
  'data-premium-surface="onboarding"',
  'data-premium-surface="today"',
  'premium-proof',
  'premium-signal-rail',
  'premium-deep-dive',
  'premium-trust-strip',
  'route-tools-menu',
  'route-today-kicker',
  'data-premium-surface="teacher"',
  'data-premium-surface="exams"',
  'PREMIUM TEACHER + EXAM CENTER V1',
  'Rota Hoca öğrenme döngüsü',
  'ROTA BU SONUÇTAN NE ÖĞRENDİ?',
  'Hedefin analiz ediliyor',
  'Ders ağırlıkların hesaplanıyor',
  'Çalışma kapasiten dengeleniyor',
  'Rotan ve tekrar döngün hazırlanıyor',
  'Rota’nın ayrıntılı analizini gör',
  'Planı ayarla',
  'Verilerin bu tarayıcıda saklanır',
  'Plus üyelik satışı henüz açık değil',
  'Üyelik satışı açılana kadar varsayılan paket Ücretsiz',
  'Satış başlamadan önce fiyat kesinleşecek · Ücretsiz paketle başlayabilirsin.',
  'Plus paketleri <span>· Üyelik satışı henüz açık değil</span>',
  'Üyelik satışı açılana kadar bu seçenek satın alınamaz; fiyat satıştan önce kesinleşecek.',
  'Gelişmiş devamlar Plus',
  '/kpss-practice-catalog.js',
  'BÖLÜM DENEMELERİ',
  'Dersin gerçek soru sayısıyla çöz.',
  'start-section-exam',
  'section-exam-form',
  'Bölüm denemesi sonucu',
  'Konu dağılımı geçmiş sınav eğilimlerini yaklaşıklar.',
  'Neden bugün?',
  'ROTA PLUS REPORTS V1',
  'report-premium-hero',
  'report-kpis',
  'report-week-bars',
  'report-trend-bars',
  '6 aylık trendler',
  'Çalışmanın izini, varsayım katmadan gör.',
  'Bu 6 aylık dönemde ders kaydı yok.',
  'Trend yorumu için en az iki ay çalışma kaydı gerekiyor.',
  'Plan gerçekleşme eğilimi için en az iki ay zamanı gelmiş plan verisi gerekiyor.',
  'Tek kayıt · trend için erken',
  'Soru yapısı değiştiği için net farkı hesaplanmadı',
  'Seçili ayda veri yok',
  'Önceki ayda veri yok',
  'İki ayda da veri yok',
  'Karşılaştırılabilir veri yok',
  "emptyWeek?'is-empty'",
  "emptyMonth?'is-empty'",
  '.report-coverage{grid-template-columns:1fr}',
  '.report-subject-row .grow{min-width:0}',
  'overflow-wrap:anywhere;word-break:break-word'
]) assert.ok(html.includes(marker),'Missing premium product contract marker: '+marker);

assert.ok(
  html.indexOf('data-premium-surface="welcome"') < html.indexOf('data-premium-surface="onboarding"'),
  'Premium welcome must remain before onboarding in the product flow'
);

assert.ok(
  /@media\(prefers-reduced-motion:reduce\)/.test(html),
  'Premium motion layer must preserve reduced-motion accessibility'
);

assert.ok(
  !/data-premium-surface="today"[\s\S]{0,2000}confounded/i.test(html),
  'Premium Today surface must not introduce technical causal jargon near the primary UI'
);

assert.ok(!html.includes('Pilot sürüm · Ödeme ve gerçek üyelik aktif değil'),'Primary product surfaces must not use prototype-style pilot warning copy');
for(const phrase of ['Beta paket tasarımı','Fiyatlar test amaçlıdır','Örnek fiyat','fiyat testi tamamlanmadı','Paket tasarımı','İlk ücretli test','lansman fiyatını nasıl göstereceğimize dair önizleme','Bu önizlemede abonelik','Şu anda beta sürümündesin','BETA · ÜYELİK SATIŞI HENÜZ KAPALI']){
  assert.ok(!html.includes(phrase),'Membership surfaces must not look like an engineering demo: '+phrase);
}
assert.ok(!html.includes('rota-plus:visual-demo'),'Premium UI must not trust sessionStorage as an entitlement authority');
assert.ok(!html.includes('data-action="paid-tier"'),'Premium UI must not expose a self-service tier switch');
assert.ok(!html.includes('Plus görünümünü dene'),'Pricing UI must not visually grant Plus before account/payment entitlement exists');
assert.ok(html.includes("fetch('/api/entitlements'"),'Premium UI must load its entitlement from the server boundary');
assert.ok(html.includes("featureEnabled('advanced_teacher_insights')"),'Advanced teacher continuations must obey the central feature policy');
assert.ok(html.includes('window.RotaKpssPractice?.topicSets'),'KPSS topic practices must extend the existing mini catalog without replacing it');
assert.ok(html.includes('topicBreakdown'),'Section exam results must preserve topic-level evidence for the route engine');
for(const phrase of ['Production beta fail-closed','server entitlement','entitlement kaynağı','Sunucu yetkisi','Yetki servisine ulaşılamadı','Free yetkisi aktif','Plus yetkisi aktif','Plus özelliklerin sunucu tarafından açık.']){
  assert.ok(!html.includes(phrase),'User-facing product copy must not expose technical access jargon: '+phrase);
}
assert.ok(html.includes('Plus erişimi yalnız doğrulanmış üyelikle açılacak'),'Membership copy must explain Plus access in user language');
assert.ok(html.includes('Plus paketini incele'),'Pricing CTA must not imply that payment is already live');
for(const phrase of ['Sıradaki çalışmanı da belirle.','ANALİZ + TEKRAR + RAPOR','Detaylı Rota Hoca analizleri','Her denemeden sonra net bir adım.']){
  assert.ok(!html.includes(phrase),'Plus copy must not imply that the Free learning loop is paywalled: '+phrase);
}
for(const phrase of ['RAPOR + TREND + ROTA HOCA','Zaman içindeki desenini de gör.','6 aylık çalışma ve plan trendleri','Gelişmiş Rota Hoca devamları','Veri güveni ve karşılaştırılabilirlik açıklamaları']){
  assert.ok(html.includes(phrase),'Plus value proposition must match implemented premium capabilities: '+phrase);
}

console.log('Premium UI contract passed: living UI + server-sourced Free/Plus gates + polished user copy + honest empty report states');

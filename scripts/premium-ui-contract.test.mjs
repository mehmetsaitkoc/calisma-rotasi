import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

for(const marker of [
  'PREMIUM PRODUCT PASS V1',
  'PREMIUM EXPERIENCE COMPONENTS V1',
  'data-premium-surface="welcome"',
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
  'Neden bugün?'
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

console.log('Premium UI contract passed: landing + onboarding + build + Today hierarchy + trust polish');

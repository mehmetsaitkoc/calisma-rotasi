import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../server.mjs',import.meta.url),'utf8');

for(const marker of [
  'const MAX_BODY = 7 * 1024 * 1024',
  'const TEACHER_RATE_LIMIT = 20',
  'const TTS_RATE_LIMIT = 36',
  'const TEACHER_MAX_OUTPUT_TOKENS = 1400',
  'function isLocalRequest',
  "process.env.RENDER === 'true'",
  'function clientIp',
  "scope + ':' + clientIp(req)",
  "'x-forwarded-for'",
  'function safePhoto',
  'function validateAnswer',
  "text:{format:{type:'json_schema'",
  "store: false"
]) assert.ok(src.includes(marker),'Missing server safety marker: '+marker);

assert.ok(src.includes("Bu soru için tahmin veya demo içerik cevabı göstermiyorum."),'Unavailable fallback must be explicit');
assert.ok(src.includes("GERÇEK AI KULLANILMADI — ders cevabı üretilmedi."),'Fallback must disclose that no real AI answer was produced');
assert.ok(src.includes("route_signal:{importance:0"),'Fallback must not affect the route');
assert.ok(src.includes("code:'RATE_LIMITED'"),'Rate limiting must return a machine-readable code');
assert.ok(src.includes('honestUnavailableFallback:true'),'Health endpoint must expose honest fallback policy');
assert.ok(src.includes("if(!isLocalRequest(req)) return json(res,403"),'Render must not expose runtime API-key configuration');
assert.ok(!src.includes("direct='Demo test cevabı'"),'Server must not fabricate a generic demo answer');

console.log('Server contracts passed: schema + body/photo guards + honest fallback + rate limits');

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

await import('./public/route-contracts.js');
const PRODUCT_CONTRACTS = globalThis.RotaContracts;
if(!PRODUCT_CONTRACTS) throw new Error('RotaContracts product policy could not be loaded.');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const INDEX = path.join(PUBLIC, 'index.html');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const IS_RENDER = process.env.RENDER === 'true';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/,'');
let runtimeApiKey = process.env.OPENAI_API_KEY || '';
const requestedProfile = ['best','balanced','economy'].includes(process.env.ROTA_AI_PROFILE) ? process.env.ROTA_AI_PROFILE : 'economy';
// Public beta defaults to economy even if an older Render env still says "best".
// Premium models can be explicitly re-enabled later with ROTA_ALLOW_PREMIUM=1.
let runtimeProfile = process.env.ROTA_ALLOW_PREMIUM === '1' ? requestedProfile : 'economy';
let runtimeModel = process.env.ROTA_AI_MODEL || ({best:'gpt-6-astra',balanced:'gpt-5.6-sol',economy:'gpt-5.6-luna'}[runtimeProfile]);
const TTS_MODEL = process.env.ROTA_TTS_MODEL || 'gpt-4o-mini-tts';
const MALE_VOICE = process.env.ROTA_TTS_MALE_VOICE || 'cedar';
const FEMALE_VOICE = process.env.ROTA_TTS_FEMALE_VOICE || 'marin';
const MAX_BODY = 7 * 1024 * 1024;
const TEACHER_RATE_LIMIT = 20;
const TTS_RATE_LIMIT = 36;
const RATE_WINDOW_MS = 60_000;
const TEACHER_MAX_OUTPUT_TOKENS = 1400;
const RATE_BUCKET_PRUNE_AT = 2048;
const buckets = new Map();

const PROFILE_MODELS = {
  best:['gpt-6-astra','gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna'],
  balanced:['gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna'],
  economy:['gpt-5.6-luna']
};

function runtimeTier(){
  if(IS_RENDER) return 'free';
  return PRODUCT_CONTRACTS.normalizeTier(process.env.ROTA_DEV_TIER || 'free');
}
function runtimeEntitlement(){
  const tier=runtimeTier();
  return PRODUCT_CONTRACTS.entitlementForTier(tier,{
    source:IS_RENDER?'public_beta':'local_dev',
    status:tier==='plus'?'dev_plus':'free',
    purchaseEnabled:false,
    accountRequired:true
  });
}
function requireRuntimeFeature(feature){
  const entitlement=runtimeEntitlement();
  if(!PRODUCT_CONTRACTS.featureEnabled(entitlement.tier,feature)){
    throw Object.assign(new Error('Bu özellik Rota Plus gerektiriyor.'),{
      status:403,
      code:'PLUS_REQUIRED',
      feature
    });
  }
  return entitlement;
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store'});
  res.end(body);
}
function isLocalRequest(req) {
  if (IS_RENDER) return false;
  const ip = req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}
function clientIp(req) {
  const forwarded = IS_RENDER
    ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    : '';
  return forwarded || req.socket.remoteAddress || 'local';
}
function pruneRateBuckets(now, windowMs) {
  if (buckets.size <= RATE_BUCKET_PRUNE_AT) return;
  for (const [key, times] of buckets) {
    const fresh = times.filter(t => now - t < windowMs);
    if (fresh.length) buckets.set(key, fresh);
    else buckets.delete(key);
  }
}
function rateLimit(req, scope, limit=30, windowMs=60_000) {
  const now = Date.now();
  pruneRateBuckets(now, windowMs);
  const key = scope + ':' + clientIp(req);
  const old = buckets.get(key) || [];
  const fresh = old.filter(t => now - t < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    const tooLarge=()=>Object.assign(new Error('İstek çok büyük.'),{status:413});
    let size=0, chunks=[], failed=false;
    req.on('error', e => { if(!failed) reject(e); });
    const declared=Number(req.headers['content-length']||0);
    if(Number.isFinite(declared)&&declared>MAX_BODY){
      failed=true;
      req.resume();
      reject(tooLarge());
      return;
    }
    req.on('data', c => {
      if(failed)return;
      size += c.length;
      if (size > MAX_BODY) {
        failed=true;
        chunks=[];
        reject(tooLarge());
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if(failed)return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('Geçersiz JSON.'),{status:400})); }
    });
  });
}
function cleanText(v, max=5000){ return typeof v === 'string' ? v.slice(0,max) : ''; }
const TEACHER_CONTEXT_VERSION = 2;
const TEACHER_CONTEXT_KEYS = new Set(['contextVersion','exam','track','selected','target','targetDate','dailyMinutes','topicStatus','routeSummary','completion','todaySummary','todayPlan','routeMode','routeDecision','studentModel','examRisk','mastery','recentExams','recentMistakes','recentLogs','teacherSignals','contextHealth']);
function sanitizeContextValue(value,depth=0){
  if(depth>5)return null;
  if(typeof value==='string')return cleanText(value,700);
  if(typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?Math.max(-100000000,Math.min(100000000,value)):null;
  if(Array.isArray(value))return value.slice(0,10).map(v=>sanitizeContextValue(v,depth+1)).filter(v=>v!==undefined);
  if(value&&typeof value==='object'){
    const out={};let count=0;
    for(const [key,item] of Object.entries(value)){
      if(['__proto__','prototype','constructor'].includes(key)||count>=24)continue;
      const clean=sanitizeContextValue(item,depth+1);
      if(clean!==undefined){out[key]=clean;count++;}
    }
    return out;
  }
  if(value===null)return null;
  return undefined;
}
function cleanTeacherContext(value){
  const raw=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const out={contextVersion:[1,2].includes(Number(raw.contextVersion))?Number(raw.contextVersion):TEACHER_CONTEXT_VERSION};
  for(const key of TEACHER_CONTEXT_KEYS){
    if(key==='contextVersion'||!(key in raw))continue;
    const clean=sanitizeContextValue(raw[key],0);
    if(clean!==undefined)out[key]=clean;
  }
  return out;
}
function safePhoto(photo){
  if (!photo) return '';
  if (typeof photo !== 'string' || photo.length > 5_800_000) throw Object.assign(new Error('Fotoğraf çok büyük.'),{status:413});
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(photo)) throw Object.assign(new Error('Desteklenmeyen fotoğraf biçimi.'),{status:400});
  return photo;
}
function extractOutputText(data){
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  for (const item of data?.output || []) for (const c of item?.content || []) if (typeof c?.text === 'string') return c.text;
  return '';
}
function isStem(subject, question){
  const t=(subject+' '+question).toLocaleLowerCase('tr-TR');
  return /(matematik|geometri|fizik|kimya|sayısal|denklem|fonksiyon|türev|integral|olasılık|oran|problem|hız|kuvvet|enerji|mol|asit|baz|\d\s*[+\-*/^×÷=])/.test(t);
}
function needsFreshWeb(question){
  const t=(question||'').toLocaleLowerCase('tr-TR');
  return /(güncel|bugün|şu an|son durum|en son|2026|mevzuat|yönetmelik|kanun değiş|atama|başvuru tarihi|sınav tarihi|kontenjan|puan türü|resm[iî] gazete|bakanlık duyuru|ösym duyuru)/i.test(t);
}
function needsHeavyCode(subject,question){
  const t=((subject||'')+' '+(question||'')).toLocaleLowerCase('tr-TR');
  if (/(türev|integral|limit|logaritma|trigonometri|olasılık|permütasyon|kombinasyon|karmaşık|vektör|kinematik|elektrik|mol hesabı|stokiyometri)/i.test(t)) return true;
  const ops=(t.match(/[+\-*/^×÷=]/g)||[]).length;
  const nums=(t.match(/\d+(?:[.,]\d+)?/g)||[]).length;
  return ops>=4 && nums>=4;
}
function validateAnswer(a){
  if(!a || typeof a!=='object') throw new Error('Model cevabı geçersiz.');
  for(const k of ['kind','direct_answer','message','diagnosis','steps','summary','confidence','detected_subject','detected_topic','difficulty','needs_clarification','verification','route_signal','source_notes']) if(!(k in a)) throw new Error('Model cevabında alan eksik: '+k);
  if(!Array.isArray(a.steps)||!Array.isArray(a.source_notes)) throw new Error('Model cevabı liste alanları geçersiz.');
  return a;
}

const schema = {
  type:'object', additionalProperties:false,
  properties:{
    kind:{type:'string',enum:['chat','fact','solution','concept','study','clarify']},
    direct_answer:{type:'string'},
    message:{type:'string'},
    diagnosis:{type:'string'},
    steps:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},text:{type:'string'}},required:['title','text']}},
    summary:{type:'string'},
    confidence:{type:'number',minimum:0,maximum:1},
    detected_subject:{type:'string'},
    detected_topic:{type:'string'},
    difficulty:{type:'string',enum:['basic','medium','advanced']},
    needs_clarification:{type:'boolean'},
    verification:{type:'object',additionalProperties:false,properties:{status:{type:'string',enum:['checked','partial','not_needed','uncertain']},methods:{type:'array',items:{type:'string'}},note:{type:'string'}},required:['status','methods','note']},
    route_signal:{type:'object',additionalProperties:false,properties:{importance:{type:'integer',minimum:0,maximum:3},reason:{type:'string'}},required:['importance','reason']},
    source_notes:{type:'array',items:{type:'string'}}
  },
  required:['kind','direct_answer','message','diagnosis','steps','summary','confidence','detected_subject','detected_topic','difficulty','needs_clarification','verification','route_signal','source_notes']
};


function demoTeacherAnswer(body, reason='quota'){
  const subject=cleanText(body?.subject,140);
  const topic=cleanText(body?.topic,200);
  const photo=!!body?.photo;
  const reasonText=reason==='not_configured'
    ? 'Rota Hoca gerçek AI bağlantısı şu anda yapılandırılmamış.'
    : 'Rota Hoca gerçek AI kotasına şu anda erişemiyor.';
  return {
    kind:'clarify',
    direct_answer:'',
    message:reasonText+' Bu soru için tahmin veya demo içerik cevabı göstermiyorum.',
    diagnosis:'Gerçek model çağrısı yapılmadığı için güvenilir bir ders cevabı üretilemez.',
    steps:[
      {title:'Sorunu koru',text:'Sorunu değiştirmeden daha sonra tekrar gönderebilirsin.'},
      {title:'Rotana devam et',text:'Bu geçici durum Student Model veya rota kararını etkilemez.'}
    ],
    summary:'Gerçek AI yeniden kullanılabilir olduğunda soruyu tekrar gönder.',
    confidence:1,
    detected_subject:subject||'',
    detected_topic:topic||'',
    difficulty:'basic',
    needs_clarification:true,
    verification:{status:'uncertain',methods:[],note:'Gerçek model çağrısı yapılmadı.'},
    route_signal:{importance:0,reason:'AI unavailable fallback rota kararını etkilemez.'},
    source_notes:['GERÇEK AI KULLANILMADI — ders cevabı üretilmedi.'],
    _demo:true,
    _demo_reason:reason,
    _unavailable:true,
    _photo_received:photo
  };
}
function isQuotaError(status,data,raw){
  const msg=String(data?.error?.message||raw||'').toLocaleLowerCase('en-US');
  const code=String(data?.error?.code||'').toLocaleLowerCase('en-US');
  return status===429 && (code.includes('insufficient_quota') || msg.includes('no credits') || msg.includes('quota') || msg.includes('billing'));
}

async function callTeacher(body){
  const question = cleanText(body.question, 5000).trim();
  const photo = safePhoto(body.photo);
  const context = cleanTeacherContext(body.studentContext);
  const mode = ['base','simple','alternate','similar','review'].includes(body.mode) ? body.mode : 'base';
  if(!question && !photo) throw Object.assign(new Error('Sorunu yaz veya fotoğraf ekle.'),{status:400});
  const entitlement=requireRuntimeFeature('teacher_basic');
  if(mode!=='base') requireRuntimeFeature('advanced_teacher_insights');
  if (!runtimeApiKey) return {answer:demoTeacherAnswer({...body,question,photo},'not_configured'),model:'unavailable',responseId:'',usage:null,demo:true,demoReason:'Gerçek AI bağlantısı yapılandırılmamış.',meta:{mode:'unavailable',profile:runtimeProfile,rateLimitPerMinute:TEACHER_RATE_LIMIT,maxOutputTokens:TEACHER_MAX_OUTPUT_TOKENS,contextVersion:context.contextVersion,tier:entitlement.tier}};
  const exam = cleanText(body.exam, 50) || 'Belirtilmedi';
  const track = cleanText(body.track, 100);
  const subject = cleanText(body.subject, 140);
  const topic = cleanText(body.topic, 200);
  const previous = body.previousAnswer && typeof body.previousAnswer === 'object' ? body.previousAnswer : null;
  const contextText = JSON.stringify(context).slice(0,11000);
  const previousText = previous ? JSON.stringify(previous).slice(0,8000) : '';
  const instructions = `Sen Çalışma Rotası içindeki Rota Hoca'sın. Türkçe konuşan, sakin, güvenilir ve sınav odaklı bir KPSS/YKS öğretmenisin.

Öğrenci bağlamı:
- Sınav: ${exam}${track?` / ${track}`:''}
- Seçili ders: ${subject||'belirtilmedi'}
- Seçili konu: ${topic||'belirtilmedi'}

Zorunlu davranış kuralları:
1) Geçerli bir müfredat veya genel bilgi sorusunu gerçekten cevapla. Basit bilgi sorularında doğru cevabı ilk cümlede ver; gereksiz yere “bilmiyorum” deme.
2) Matematik/geometri/fizik/kimyada hesabı ve sonucu kendi içinde kontrol et. Gerekirse Code Interpreter kullan. Kullanıcıya gizli düşünce zinciri verme; bunun yerine kısa, öğretici ve doğrulanabilir çözüm adımları yaz.
3) Fotoğraf varsa soru metnini, seçenekleri, şekli ve tabloyu görselden incele. Görsel gerçekten okunamıyorsa tahmin etme; needs_clarification=true yap ve tam olarak neyin net olmadığını söyle.
4) Çoktan seçmeli soruda mümkünse doğru seçeneği direct_answer alanında belirt ve kısa gerekçe ver.
5) Güncel mevzuat, güncel kurum bilgisi, güncel kişi/tarih/istatistik veya değişebilecek bilgi sorulursa web aramasını kullan. Kaynak kullandıysan source_notes alanına kısa kaynak notları ekle.
6) Seçili ders/konu yanlışsa soruyu reddetme. detected_subject ve detected_topic alanlarında doğru sınıflandırmayı yaz; cevap yine ver.
7) Emin olmadığın şeyi uydurma. Belirsizlik çözümü etkiliyorsa clarification iste; confidence değerini gerçekçi tut.
8) Cevap pedagojik olsun: direct_answer = doğrudan sonuç; diagnosis = öğrencinin muhtemel takıldığı nokta; steps = öğrenciye gösterilecek kısa adımlar; summary = tek cümlelik kapanış.
9) “simple” modunda daha sade ve kısa; “alternate” modunda farklı çözüm yolu; “similar” modunda çözümsüz benzer soru; “review” modunda kısa konu özeti üret.
10) Öğrencinin geçmiş verisini yalnız eğitim amaçlı kullan. route_signal yalnızca gerçekten tekrar yararlıysa 1-3, değilse 0 olsun.
11) Sorunun kendisi sohbet ise kind=chat; ders sorusuysa fact/solution/concept; çalışma tavsiyesiyse study; netleştirme gerekiyorsa clarify.

Öğrenci çalışma bağlamı: ${contextText}
${previousText?`Önceki cevap/bağlam: ${previousText}\n`:''}İstenen devam modu: ${mode}.`;

  const content = [{type:'input_text', text: question || 'Bu fotoğraftaki soruyu çöz. Önce soruyu doğru oku, sonra öğretmen gibi açıkla.'}];
  if (photo) content.push({type:'input_image', image_url:photo, detail:'high'});
  const tools=[];
  if(needsFreshWeb(question)) tools.push({type:'web_search'});
  if(needsHeavyCode(subject,question)) tools.push({type:'code_interpreter',container:{type:'auto'}});
  const payload = {
    model: runtimeModel,
    store: false,
    instructions,
    input:[{role:'user',content}],
    tools,
    text:{format:{type:'json_schema',name:'rota_hoca_answer',strict:true,schema}},
    reasoning:{effort:photo?'medium':(needsHeavyCode(subject,question)?'medium':(isStem(subject,question)?'low':'none'))},
    max_output_tokens:TEACHER_MAX_OUTPUT_TOKENS
  };
  const response = await fetch(OPENAI_BASE_URL + '/responses', {method:'POST',headers:{'authorization':`Bearer ${runtimeApiKey}`,'content-type':'application/json'},body:JSON.stringify(payload)});
  const raw = await response.text();
  let data; try { data=JSON.parse(raw); } catch { data={}; }
  if (!response.ok) {
    if (isQuotaError(response.status,data,raw)) {
      return {answer:demoTeacherAnswer(body,'no_credits'),model:'unavailable',responseId:'',usage:null,demo:true,demoReason:'Gerçek AI kotası kullanılamıyor; içerik cevabı üretilmedi.',meta:{mode:'unavailable',profile:runtimeProfile,rateLimitPerMinute:TEACHER_RATE_LIMIT,maxOutputTokens:TEACHER_MAX_OUTPUT_TOKENS}};
    }
    throw Object.assign(new Error(data?.error?.message || `AI isteği başarısız (${response.status}).`), {status:502});
  }
  const text = extractOutputText(data);
  if (!text) throw Object.assign(new Error('Model yapılandırılmış cevap döndürmedi.'), {status:502});
  let answer; try { answer=validateAnswer(JSON.parse(text)); } catch(e) { throw Object.assign(new Error('Model cevabı çözümlenemedi: '+e.message), {status:502}); }
  return {answer, model:data.model || runtimeModel, responseId:data.id || '', usage:data.usage || null,meta:{mode:'live',profile:runtimeProfile,rateLimitPerMinute:TEACHER_RATE_LIMIT,maxOutputTokens:TEACHER_MAX_OUTPUT_TOKENS,contextVersion:context.contextVersion}};
}

async function callTTS(body){
  if (!runtimeApiKey) throw Object.assign(new Error('Rota Hoca AI henüz bağlanmadı.'), {status:503});
  const input = cleanText(body.text, 4096).trim();
  if(!input) throw Object.assign(new Error('Seslendirilecek metin boş.'),{status:400});
  const gender = body.gender === 'female' ? 'female' : 'male';
  const voice = gender === 'female' ? FEMALE_VOICE : MALE_VOICE;
  const instructions = gender === 'female'
    ? 'Türkçe konuşan yetişkin bir kadın öğretmen gibi, doğal, sakin, sıcak ve profesyonel konuş. Orta tonda, temiz diksiyonla, acele etmeden anlat. Reklam veya spiker tonu kullanma.'
    : 'Türkçe konuşan yetişkin bir erkek öğretmen gibi, doğal, sakin, sıcak ve profesyonel konuş. Orta-alt ses perdesinde, temiz diksiyonla, acele etmeden anlat. Reklam veya spiker tonu kullanma.';
  const response = await fetch(OPENAI_BASE_URL + '/audio/speech', {method:'POST',headers:{'authorization':`Bearer ${runtimeApiKey}`,'content-type':'application/json'},body:JSON.stringify({model:TTS_MODEL,voice,input,instructions,response_format:'mp3',speed:0.95})});
  if(!response.ok){let msg='Ses üretilemedi.';try{const e=await response.json();msg=e?.error?.message||msg;}catch{}throw Object.assign(new Error(msg),{status:502});}
  return Buffer.from(await response.arrayBuffer());
}

async function modelAvailable(key,model){
  const check=await fetch(OPENAI_BASE_URL + '/models/' + encodeURIComponent(model),{headers:{'authorization':`Bearer ${key}`}});
  if(check.ok)return {ok:true};
  let message='Model erişimi yok.';try{const j=await check.json();message=j?.error?.message||message;}catch{}
  return {ok:false,message};
}
function mime(file){ const ext=path.extname(file).toLowerCase(); return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'}[ext]||'application/octet-stream'); }
function serve(req,res){
  let p; try { p=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { p='/'; }
  if(p==='/' || p==='/index.html'){
    return fs.readFile(INDEX,(err,data)=>{
      if(err) return json(res,500,{error:'Arayüz dosyası bulunamadı.'});
      const source=data.toString('utf8');
      const enhanced=source
        .replace('</head>','<link rel="stylesheet" href="/landing-final.css"></head>')
        .replace('</body>','<script src="/intelligence-v1.js"></script><script src="/intelligence-bridge-v1.js"></script><script src="/landing-final.js" defer></script></body>');
      const body=Buffer.from(enhanced,'utf8');
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','content-length':body.length,'cache-control':'no-store'});
      res.end(body);
    });
  }
  const file=path.normalize(path.join(PUBLIC,p));
  if(!file.startsWith(PUBLIC)) return json(res,403,{error:'Yasak yol.'});
  fs.stat(file,(err,st)=>{if(err||!st.isFile()) return json(res,404,{error:'Bulunamadı.'});res.writeHead(200,{'content-type':mime(file),'cache-control':'no-store'});fs.createReadStream(file).pipe(res);});
}

const server=http.createServer(async (req,res)=>{
  res.setHeader('x-content-type-options','nosniff');
  res.setHeader('referrer-policy','no-referrer');
  res.setHeader('x-frame-options','SAMEORIGIN');
  if(req.method==='GET'&&req.url==='/api/health'){ const local=isLocalRequest(req),entitlement=runtimeEntitlement(); return json(res,200,{ok:true,aiConfigured:!!runtimeApiKey,ttsConfigured:!!runtimeApiKey,model:runtimeModel,profile:runtimeProfile,ttsModel:TTS_MODEL,demoFallback:false,honestUnavailableFallback:true,entitlement:{tier:entitlement.tier,source:entitlement.source,purchaseEnabled:entitlement.purchaseEnabled,accountRequired:entitlement.accountRequired},teacherPolicy:{rateLimitPerMinute:TEACHER_RATE_LIMIT,windowMs:RATE_WINDOW_MS,maxBodyBytes:MAX_BODY,maxOutputTokens:TEACHER_MAX_OUTPUT_TOKENS,costProfile:runtimeProfile,contextSchemaVersion:TEACHER_CONTEXT_VERSION},configurable:local&&!runtimeApiKey,deploy:{provider:IS_RENDER?'render':'local',gitCommit:process.env.RENDER_GIT_COMMIT||'',gitBranch:process.env.RENDER_GIT_BRANCH||'',repo:process.env.RENDER_GIT_REPO_SLUG||'',externalUrl:process.env.RENDER_EXTERNAL_URL||''}}); }
  if(req.method==='GET'&&req.url==='/api/entitlements'){ return json(res,200,runtimeEntitlement()); }

  if(req.method==='POST'&&req.url==='/api/configure'){
    if(!isLocalRequest(req)) return json(res,403,{error:'AI anahtarı yalnızca yerel uygulama çalıştırmasında bağlanabilir.'});
    try{
      const body=await readJson(req);
      const key=cleanText(body.apiKey,500).trim();
      if(key.length<20) return json(res,400,{error:'Geçerli bir OpenAI API anahtarı gir.'});
      const profile=['best','balanced','economy'].includes(body.profile)?body.profile:'economy';
      const forced=cleanText(body.model,80).trim();
      const candidates=[...new Set([...(forced?[forced]:[]),...PROFILE_MODELS[profile]])];
      let okModel='', lastMsg='API anahtarı veya model erişimi doğrulanamadı.';
      for(const candidate of candidates){
        const check=await modelAvailable(key,candidate);
        if(check.ok){okModel=candidate;break;}
        lastMsg=check.message||lastMsg;
      }
      if(!okModel)return json(res,400,{error:lastMsg});
      runtimeApiKey=key;runtimeProfile=profile;runtimeModel=okModel;
      return json(res,200,{ok:true,model:runtimeModel,profile:runtimeProfile,ttsModel:TTS_MODEL});
    }catch(e){return json(res,e.status||500,{error:e.message||'AI bağlantısı kurulamadı.'});}
  }
  if(req.method==='POST'&&req.url==='/api/teacher'){
    if(!rateLimit(req,'teacher',TEACHER_RATE_LIMIT,RATE_WINDOW_MS)) return json(res,429,{error:'Çok hızlı istek gönderildi. Biraz sonra tekrar dene.',code:'RATE_LIMITED',retryAfterSeconds:60});
    try{const body=await readJson(req);const out=await callTeacher(body);return json(res,200,out);}catch(e){return json(res,e.status||500,{error:e.message||'Rota Hoca isteği başarısız.',...(e.code?{code:e.code}:{}),...(e.feature?{feature:e.feature}:{})});}
  }
  if(req.method==='POST'&&req.url==='/api/tts'){
    if(!rateLimit(req,'tts',TTS_RATE_LIMIT,RATE_WINDOW_MS)) return json(res,429,{error:'Ses istek limiti aşıldı.',code:'RATE_LIMITED',retryAfterSeconds:60});
    try{const body=await readJson(req);const audio=await callTTS(body);res.writeHead(200,{'content-type':'audio/mpeg','content-length':audio.length,'cache-control':'no-store','x-rota-voice-profile':body.gender==='female'?'female':'male'});return res.end(audio);}catch(e){return json(res,e.status||500,{error:e.message||'Ses üretilemedi.'});}
  }
  if(req.method==='GET') return serve(req,res);
  return json(res,405,{error:'Desteklenmeyen yöntem.'});
});
server.listen(PORT,HOST,()=>{
  console.log(`Çalışma Rotası: http://${HOST}:${PORT}`);
  console.log(runtimeApiKey ? `Rota Hoca AI açık · ${runtimeModel} · ${runtimeProfile}` : 'Rota Hoca AI henüz bağlı değil · uygulama içinden bağlayabilirsin');
});
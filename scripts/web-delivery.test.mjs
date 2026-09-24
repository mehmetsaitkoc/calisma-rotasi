import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PORT=Number(process.env.WEB_DELIVERY_TEST_PORT||8913);
const BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const source=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const tagRe=/<script\b[^>]*\bsrc=["'](\/questions\/kpss\/([^\/"']+)\/[^"']+\/test-[1-4]\.js)["'][^>]*>\s*<\/script>\s*/gi;
const expected=new Map();
for(const match of source.matchAll(tagRe)){
  const files=expected.get(match[2])||[];
  files.push(match[1]);
  expected.set(match[2],files);
}
const subjects=[...expected.keys()];
assert.equal(subjects.length,6,'Canonical index must contain exactly six KPSS subject groups');
assert.equal(subjects.reduce((sum,subject)=>sum+expected.get(subject).length,0),256,'Canonical index must contain exactly 256 KPSS topic-test modules');
assert.deepEqual([...subjects].sort(),['cografya','guncel-bilgiler','matematik','tarih','turkce','vatandaslik']);

let server,serverLog='';
async function start(){
  server=spawn(process.execPath,['server.mjs'],{
    env:{
      ...process.env,
      PORT:String(PORT),
      HOST:'127.0.0.1',
      RENDER:'true',
      NODE_ENV:'production',
      ROTA_APP_ORIGIN:'https://beta.example',
      OPENAI_API_KEY:''
    },
    stdio:['ignore','pipe','pipe']
  });
  server.stdout.on('data',x=>serverLog+=x);
  server.stderr.on('data',x=>serverLog+=x);
  for(let i=0;i<120;i++){
    if(server.exitCode!==null)throw Error(serverLog||'Web delivery server exited');
    try{if((await fetch(BASE+'/api/health')).ok)return;}catch{}
    await sleep(50);
  }
  throw Error(serverLog||'Web delivery server timeout');
}
async function stop(){
  if(server&&server.exitCode===null){
    server.kill('SIGTERM');
    for(let i=0;i<40&&server.exitCode===null;i++)await sleep(25);
    if(server.exitCode===null)server.kill('SIGKILL');
  }
}

try{
  await start();

  const landingResponse=await fetch(BASE+'/',{headers:{'accept-encoding':'identity'}});
  assert.equal(landingResponse.status,200);
  assert.equal(landingResponse.headers.get('content-encoding'),null);
  assert.match(landingResponse.headers.get('etag')||'',/^W\/"[A-Za-z0-9_-]{24}"$/,'Dynamic index ETag must be content-derived');
  assert.match(landingResponse.headers.get('x-content-type-options')||'',/nosniff/i);
  assert.equal(landingResponse.headers.get('x-frame-options'),'SAMEORIGIN');
  assert.equal(landingResponse.headers.get('referrer-policy'),'no-referrer');
  assert.match(landingResponse.headers.get('permissions-policy')||'',/camera=\(\)/);
  const html=await landingResponse.text();

  const bundleTags=[...html.matchAll(/<script\b[^>]*\bsrc=["'](\/runtime\/kpss-bundle\/([a-z0-9-]+)\.js)["'][^>]*>/gi)];
  assert.equal(bundleTags.length,6,'Web HTML must contain six subject bundles');
  assert.deepEqual(bundleTags.map(x=>x[2]),subjects,'Bundle insertion order must preserve the canonical subject-group order');
  assert.equal([...html.matchAll(tagRe)].length,0,'Web HTML must not retain any of the 256 individual topic-test scripts');
  assert.match(html,/\/questions\/kpss\/branch-exams\.js/,'Branch-exam registry must remain independently loaded');
  assert.match(html,/\/questions\/kpss\/blueprints\.js/,'Exam blueprints must remain independently loaded');

  let markerCount=0,identityBytes=0,brBytes=0;
  for(const subject of subjects){
    const url=BASE+'/runtime/kpss-bundle/'+subject+'.js';
    const identity=await fetch(url,{headers:{'accept-encoding':'identity'}});
    assert.equal(identity.status,200,'Bundle must load: '+subject);
    assert.equal(identity.headers.get('content-encoding'),null,'Identity response must not claim compression');
    assert.match(identity.headers.get('cache-control')||'',/max-age=300/);
    assert.match(identity.headers.get('cache-control')||'',/stale-while-revalidate=86400/);
    assert.match(identity.headers.get('vary')||'',/Accept-Encoding/i);
    const etag=identity.headers.get('etag');
    assert.match(etag||'',/^W\/"[A-Za-z0-9_-]{24}"$/,'Bundle ETag must be content-derived: '+subject);
    const body=await identity.text();
    const markers=[...body.matchAll(/\/\* (\/questions\/kpss\/[^\s]+\/test-[1-4]\.js) \*\//g)].map(x=>x[1]);
    assert.deepEqual(markers,expected.get(subject),'Bundle must preserve canonical registration order: '+subject);
    markerCount+=markers.length;
    identityBytes+=Buffer.byteLength(body);

    const notModified=await fetch(url,{headers:{'accept-encoding':'identity','if-none-match':etag}});
    assert.equal(notModified.status,304,'Matching ETag must return 304: '+subject);
    assert.equal(await notModified.text(),'','304 must not include a body');

    const br=await fetch(url,{headers:{'accept-encoding':'br'}});
    assert.equal(br.status,200);
    assert.equal(br.headers.get('content-encoding'),'br','Brotli-capable client must receive br: '+subject);
    brBytes+=Number(br.headers.get('content-length')||0);
  }
  assert.equal(markerCount,256,'All and only 256 topic-test modules must be present across bundles');
  assert.ok(brBytes>0&&brBytes<identityBytes,'Brotli transfer must be smaller than raw question JavaScript');

  const gzip=await fetch(BASE+'/runtime/kpss-bundle/'+subjects[0]+'.js',{headers:{'accept-encoding':'br;q=0, gzip;q=1'}});
  assert.equal(gzip.headers.get('content-encoding'),'gzip','q=0 Brotli must not be selected over acceptable gzip');
  await gzip.arrayBuffer();

  const missing=await fetch(BASE+'/runtime/kpss-bundle/not-a-subject.js');
  assert.equal(missing.status,404,'Bundle endpoint must be restricted to discovered/approved subjects');

  const traversal=await fetch(BASE+'/%2e%2e%2fserver.mjs',{redirect:'manual'});
  assert.notEqual(traversal.status,200,'Encoded parent traversal must never serve files outside public/');
  const traversalText=await traversal.text();
  assert.ok(!traversalText.includes('createAccounts'),'Traversal response must not leak server source');

  console.log(JSON.stringify({
    subjects,
    topicTestModules:markerCount,
    rawQuestionBytes:identityBytes,
    brotliQuestionBytes:brBytes,
    compressionRatio:Number((brBytes/identityBytes).toFixed(4))
  }));
  console.log('Web delivery passed: 6 ordered bundles / 256 modules, branch exams + blueprints retained, Brotli/gzip, ETag 304, whitelist and traversal guards.');
} finally {
  await stop();
}

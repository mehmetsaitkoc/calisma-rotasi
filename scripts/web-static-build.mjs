import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.resolve(import.meta.dirname,'..');
const PUBLIC=path.join(ROOT,'public');
const OUT=path.join(ROOT,'dist-web-beta');
const TEST_MODULE=/^questions\/kpss\/(?:cografya|guncel-bilgiler|matematik|tarih|turkce|vatandaslik)\/.+\/test-[1-4]\.js$/;

await fs.rm(OUT,{recursive:true,force:true});
await fs.cp(PUBLIC,OUT,{
  recursive:true,
  filter(src){
    const rel=path.relative(PUBLIC,src).split(path.sep).join('/');
    return !TEST_MODULE.test(rel);
  }
});

const source=await fs.readFile(path.join(PUBLIC,'index.html'),'utf8');
const groups=new Map(),seen=new Set();
const tag=/<script\b[^>]*\bsrc=["'](\/questions\/kpss\/([^\/"']+)\/[^"']+\/test-[1-4]\.js)["'][^>]*>\s*<\/script>\s*/gi;
let index=source.replace(tag,(full,src,subject)=>{
  const files=groups.get(subject)||[];files.push(src);groups.set(subject,files);
  if(seen.has(subject))return '';
  seen.add(subject);
  return '<script src="/runtime/kpss-bundle/'+encodeURIComponent(subject)+'.js"></script>\n';
});
const count=[...groups.values()].reduce((n,x)=>n+x.length,0);
if(groups.size!==6||count!==256)throw Error('Static Web Beta expected 6 subjects / 256 KPSS test modules, got '+groups.size+' / '+count+'.');

const bundleDir=path.join(OUT,'runtime','kpss-bundle');
await fs.mkdir(bundleDir,{recursive:true});
let sourceChars=0,bundleChars=0;
for(const [subject,files] of groups){
  const parts=[];
  for(const src of files){
    const body=await fs.readFile(path.join(PUBLIC,src.replace(/^\/+/,'')),'utf8');
    sourceChars+=body.length;parts.push('\n/* '+src+' */\n'+body+'\n;');
  }
  const bundle=parts.join('');bundleChars+=bundle.length;
  await fs.writeFile(path.join(bundleDir,subject+'.js'),bundle);
}
index=index
  .replace('</head>','<script>window.RotaWebBeta=true</script><link rel="stylesheet" href="/landing-final.css"></head>')
  .replace('</body>','<script src="/landing-final.js" defer></script></body>');
await fs.writeFile(path.join(OUT,'index.html'),index);

const deletePath=path.join(OUT,'delete-account.html');
let deleteHtml=await fs.readFile(deletePath,'utf8');
deleteHtml=deleteHtml.replace('</head>','<script>window.RotaWebBeta=true</script></head>');
await fs.writeFile(deletePath,deleteHtml);

const outputIndex=await fs.readFile(path.join(OUT,'index.html'),'utf8');
if(/src=["']\/questions\/kpss\/[^"']+\/test-[1-4]\.js["']/.test(outputIndex))throw Error('Static index still contains individual KPSS test module requests.');
const runtimeTags=[...outputIndex.matchAll(/src=["']\/runtime\/kpss-bundle\/[^"']+\.js["']/g)];
if(runtimeTags.length!==6)throw Error('Static index must contain exactly six KPSS runtime bundles.');
for(const subject of groups.keys()){
  const st=await fs.stat(path.join(bundleDir,subject+'.js'));if(!st.isFile()||st.size<1000)throw Error('Missing static bundle: '+subject);
}
console.log(JSON.stringify({out:path.relative(ROOT,OUT),subjects:groups.size,tests:count,sourceChars,bundleChars,indexChars:outputIndex.length},null,2));

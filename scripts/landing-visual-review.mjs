import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT=Number(process.env.LANDING_REVIEW_PORT||8801);
const BASE=`http://127.0.0.1:${PORT}`;
const server=spawn(process.execPath,['server.mjs'],{
  env:{...process.env,PORT:String(PORT),HOST:'127.0.0.1',RENDER:'false'},
  stdio:['ignore','pipe','pipe']
});
let serverLog='';
server.stdout.on('data',d=>{serverLog+=d;});
server.stderr.on('data',d=>{serverLog+=d;});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitServer(){
  for(let i=0;i<80;i++){
    try{const r=await fetch(BASE+'/api/health');if(r.ok)return;}catch{}
    await sleep(100);
  }
  throw new Error('Landing visual-review server did not start.\n'+serverLog);
}
function boxesDoNotOverlapVertically(a,b,gap=4){
  return a.y+a.height+gap<=b.y || b.y+b.height+gap<=a.y;
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1512,height:900},deviceScaleFactor:1});
  await page.goto(BASE+'/?fresh=1',{waitUntil:'networkidle'});
  await page.locator('.welcome.premium-landing-final').waitFor({state:'visible'});

  const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  assert.ok(size.scroll<=size.inner+2,`Landing overflows 1512px viewport: ${size.scroll} > ${size.inner}`);
  assert.equal(await page.locator('#preview-bar').isVisible(),false,'Preview/development bar must stay out of the final welcome composition');

  const title=page.locator('.v6-hero-copy h1');
  const journey=page.locator('.v6-journey');
  const dashboard=page.locator('.v6-dashboard');
  const chips=page.locator('.v6-pillar-chip');
  const examCards=page.locator('[data-action="choose-exam"]');
  const examArt=page.locator('.v6-prep-art');

  await Promise.all([title.waitFor(),journey.waitFor(),dashboard.waitFor()]);
  assert.equal(await chips.count(),4,'Journey must render four separate milestone chips');
  assert.equal(await examCards.count(),1,'Landing must render one KPSS product entry point');
  assert.equal(await examCards.first().getAttribute('data-exam'),'kpss','The only landing product entry must be KPSS');
  assert.equal(await examArt.count(),1,'KPSS card must render its architectural artwork');
  assert.equal(await page.locator('[data-exam="yks"]').count(),0,'YKS must not remain selectable on the landing');
  assert.equal(await page.getByText(/\\bYKS\\b/).count(),0,'Landing must not display YKS copy');

  const [titleBox,journeyBox,dashboardBox]=await Promise.all([title.boundingBox(),journey.boundingBox(),dashboard.boundingBox()]);
  assert.ok(titleBox&&titleBox.width>380,'Hero title must keep strong desktop scale');
  assert.ok(journeyBox&&journeyBox.width>220&&journeyBox.height>500,'Journey visual must remain substantial on desktop');
  assert.ok(dashboardBox&&dashboardBox.width>520&&dashboardBox.height>470,'Dashboard preview must remain large on desktop');

  const chipBoxes=[];
  for(let i=0;i<4;i++) chipBoxes.push(await chips.nth(i).boundingBox());
  for(let i=1;i<chipBoxes.length;i++){
    assert.ok(chipBoxes[i-1]&&chipBoxes[i]&&boxesDoNotOverlapVertically(chipBoxes[i-1],chipBoxes[i],4),'Milestone chips must not overlap');
  }
  for(const box of chipBoxes){
    assert.ok(box&&dashboardBox&&box.x+box.width<=dashboardBox.x+2,'Milestone chips must stay clear of the dashboard');
  }

  const heroAsset=await page.evaluate(async()=>{
    const response=await fetch('/hero-journey-final.webp');
    const bytes=(await response.arrayBuffer()).byteLength;
    return {ok:response.ok,type:response.headers.get('content-type')||'',bytes};
  });
  assert.ok(heroAsset.ok,'Final high-resolution journey asset must load');
  assert.match(heroAsset.type,/image\/webp/i,'Final journey asset must be served as WebP');
  assert.ok(heroAsset.bytes>20000,'Final journey asset must not regress to a tiny placeholder');

  assert.ok(await page.getByText('Örnek görünüm',{exact:true}).isVisible(),'Dashboard demo disclosure must be visible');
  assert.equal(await page.getByText('10.000+',{exact:true}).count(),0,'Unverified student count must not appear');
  assert.equal(await page.getByText('4.9',{exact:true}).count(),0,'Unverified rating must not appear');
  assert.equal(await page.getByText('%95',{exact:true}).count(),0,'Unverified satisfaction metric must not appear');

  await fs.mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/landing-1512.png',fullPage:false});
  console.log(JSON.stringify({
    viewport:{width:1512,height:900},
    title:titleBox,
    journey:journeyBox,
    dashboard:dashboardBox,
    chips:chipBoxes
  },null,2));
}finally{
  if(browser) await browser.close();
  server.kill('SIGTERM');
}

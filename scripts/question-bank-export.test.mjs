import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const dest=process.argv[2];if(!dest)throw Error('Export directory required');
const data=JSON.parse(fs.readFileSync(path.join(dest,'soru-bankasi.json'))),browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(dest,'index.html')).href);
 assert.equal(await page.locator('.grid a.card').count(),6);
 for(const subject of data.subjects){
  await page.goto(pathToFileURL(path.resolve(dest,subject.id+'.html')).href);
  assert.equal(await page.locator('h1').innerText(),subject.title);
  const branches=data.branchExams.filter(e=>e.subjectId===subject.id),usages=branches.reduce((n,e)=>n+e.questionIds.length,0);
  assert.equal(await page.locator('[data-question]').count(),subject.questions+usages);
  assert.equal(await page.locator('[data-set]').count(),subject.tests+3);
  const set=data.tests.find(t=>t.subjectId===subject.id);
  await page.locator('#topic').selectOption(set.topicId);await page.locator('#test').selectOption('4');
  assert.equal(await page.locator('[data-question]:visible').count(),12);
  await page.locator('#difficulty').selectOption('hard');assert.equal(await page.locator('[data-question]:visible').count(),6);
  await page.locator('#solutions').click();assert.equal(await page.locator('[data-question]:visible details[open]').count(),6);
  await page.locator('#difficulty').selectOption('all');await page.locator('#test').selectOption('all');
  await page.locator('#search').fill(set.questions[0].id);assert.equal(await page.locator('[data-question]:visible').count(),1);
  const exported=data.tests.flatMap(t=>t.questions).find(q=>q.id===set.questions[0].id);assert.equal(exported.question,exported.text);assert.equal(exported.correctAnswer,'ABCDE'[exported.answer]);
  await page.locator('#search').fill('');await page.locator('#topic').selectOption('branch');assert.equal(await page.locator('[data-question]:visible').count(),usages);
  const ids=await page.locator('[id]').evaluateAll(xs=>xs.map(x=>x.id));assert.equal(new Set(ids).size,ids.length,'Unique DOM ids in '+subject.id);
 }
 await page.goto(pathToFileURL(path.resolve(dest,'k-tr.html')).href);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('body').evaluate(el=>el.scrollWidth<=window.innerWidth+2));
 assert.deepEqual(errors,[]);console.log('Offline export:6books,3072canonical questions,18branch papers,filters,answers,unique anchors and mobile passed.');
}finally{await browser.close()}


const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],A=$('#app'),N=$('#nav');

function R(){
  if(!MR.onboardDone){N.classList.add('hidden');return RO()}
  N.classList.remove('hidden');
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===MR.view));
  return MR.view==='checkin'?RC():MR.view==='week'?RW():MR.view==='profile'?RP():RT()
}
function okO(x){const v=MR.profile[x.k];return x.multi?Array.isArray(v)&&v.length>=2:!!v}
function RO(){
  const x=MR_ONBOARD[MR.onboardStep],v=MR.profile[x.k];
  let c=x.multi
    ?'<div class="chips">'+x.o.map(o=>`<button class="chip ${(v||[]).includes(o[0])?'sel':''}" data-m="${o[0]}">${o[1]}</button>`).join('')+'</div>'
    :'<div class="grid">'+x.o.map(o=>`<button class="opt ${v===o[0]?'sel':''}" data-o="${o[0]}"><b>${o[1]}</b><small>${o[2]}</small></button>`).join('')+'</div>';
  A.innerHTML=`<section class="card"><div class="brand">Manevî Rota · Profil</div><div class="steps">${MR_ONBOARD.map((_,i)=>`<i class="step ${i<=MR.onboardStep?'on':''}"></i>`).join('')}</div><h1>${x.q}</h1><p>Kalıcı profilin oluşacak. Sonrasında motor her gün bugünkü durumunu ve gerçek davranış geçmişini ayrı hesaplayacak.</p>${c}<div class="actions"><button class="btn secondary" id="back" ${MR.onboardStep===0?'disabled':''}>Geri</button><button class="btn primary" id="next" ${okO(x)?'':'disabled'}>${MR.onboardStep===MR_ONBOARD.length-1?'Bugüne geç':'Devam'}</button></div></section>`;
  $$('[data-o]').forEach(b=>b.onclick=()=>{MR.profile[x.k]=x.num?Number(b.dataset.o):b.dataset.o;mrSave();RO()});
  $$('[data-m]').forEach(b=>b.onclick=()=>{let a=new Set(MR.profile.priorities||[]),k=b.dataset.m;a.has(k)?a.delete(k):(a.size<4&&a.add(k));MR.profile.priorities=[...a];mrSave();RO()});
  $('#back').onclick=()=>{if(MR.onboardStep){MR.onboardStep--;mrSave();RO()}};
  $('#next').onclick=()=>{if(!okO(x))return;if(MR.onboardStep<MR_ONBOARD.length-1){MR.onboardStep++;mrSave();RO()}else{MR.onboardDone=true;MR.view='checkin';mrSave();R()}}
}

function RC(){
  const d=mrEnsure(),c=d.checkin||{},model=mrBehaviorModel(),suggest=mrSuggestDayType();
  if(!c.period){c.period=mrPeriodNow();d.checkin=c;mrSave()}
  if(!c.dayType&&suggest){c.dayType=suggest;d.checkin=c;mrSave()}
  const opts=(arr,k)=>arr.map(o=>`<button class="opt ${c[k]===o[0]?'sel':''}" data-c="${k}" data-v="${o[0]}"><b>${o[1]}</b><small>${o[2]}</small></button>`).join('');
  const learned=suggest?`<div class="why">🧠 Geçmiş haftalara göre bugün için <b>${mrDayTypeLabel(suggest)}</b> tahmini yaptım. İstersen değiştir.</div>`:'';
  A.innerHTML=`<section class="card"><div class="brand">Günlük check-in</div><h1>Bugün nasıl bir gün?</h1><p>Bu 20–30 saniyelik kontrol, aynı kişiye bile her gün farklı rota çıkarmamızı sağlar.</p>${learned}</section>
  <section class="card"><h3>Bu rotayı hangi zaman diliminde yapacaksın?</h3><div class="chips">${[['morning','🌅 Sabah'],['day','☀️ Gün içi'],['evening','🌙 Akşam']].map(o=>`<button class="chip ${c.period===o[0]?'sel':''}" data-c="period" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>${model.bestCompletionPeriod?`<p class="tiny">Şu ana kadar görevleri en sık <b>${mrPeriodLabel(model.bestCompletionPeriod)}</b> tamamlıyorsun.</p>`:''}</section>
  <section class="card"><h3>Bugün hangi tür gün?</h3><div class="grid">${opts([['work','Çalışma günü','İş / okul sorumluluğu var'],['off','İzin günü','Daha esnek zaman'],['travel','Yolculuk','Dışarıda / hareketli'],['normal','Normal gün','Belirgin bir fark yok']],'dayType')}</div></section>
  <section class="card"><h3>Bugün gerçekten kaç dakikan var?</h3><div class="chips">${[5,10,15,20,30,45].map(n=>`<button class="chip ${c.minutes===n?'sel':''}" data-c="minutes" data-v="${n}">${n} dk</button>`).join('')}</div>${model.stableMinutes?`<p class="tiny">Geçmişte başarılı olduğun günlerde ortalama <b>${model.stableMinutes} dk</b> sürdü.</p>`:''}</section>
  <section class="card"><h3>Enerjin</h3><div class="range">${[1,2,3,4,5].map(n=>`<button class="${c.energy===n?'sel':''}" data-c="energy" data-v="${n}">${n}</button>`).join('')}</div></section>
  <section class="card"><h3>Zihinsel yükün</h3><div class="range">${[1,2,3,4,5].map(n=>`<button class="${c.load===n?'sel':''}" data-c="load" data-v="${n}">${n}</button>`).join('')}</div></section>
  <section class="card"><h3>Modun</h3><div class="grid">${opts([['low','Düşük','Başlamak zor'],['calm','Sakin','Sade gidebilirim'],['normal','Normal','Dengeli'],['motivated','İstekliyim','Biraz daha yapabilirim']],'mood')}</div></section>
  <section class="card"><h3>Günün yoğunluğu</h3><div class="grid">${opts([['busy','Yoğun','Kısa ve net'],['normal','Normal','Dengeli'],['travel','Hareketli','Esnek'],['rest','Sakin','Derinleşmeye uygun']],'context')}</div></section>
  <div class="actions"><button class="btn secondary" id="base">Normal gün</button><button class="btn primary" id="go" ${mrValidCheck(c)?'':'disabled'}>Bugünkü rotayı analiz et</button></div>`;
  $$('[data-c]').forEach(b=>b.onclick=()=>{let k=b.dataset.c,v=['minutes','energy','load'].includes(k)?Number(b.dataset.v):b.dataset.v;d.checkin={...d.checkin,[k]:v};d.route=null;mrSave();RC()});
  $('#base').onclick=()=>{d.checkin={minutes:MR.profile.baseMinutes||15,energy:3,load:3,mood:'normal',context:'normal',period:mrPeriodNow(),dayType:suggest||'normal'};d.route=null;mrSave();RC()};
  $('#go').onclick=()=>{d.route=mrBuild(mrToday(),true);MR.view='today';mrSave();R()}
}

function RT(){
  const k=mrToday(),d=mrEnsure(k);
  if(!mrValidCheck(d.checkin)){MR.view='checkin';mrSave();return R()}
  const r=mrBuild(k),done=new Set(d.done||[]),pct=Math.round(done.size/r.tasks.length*100);
  A.innerHTML=`<section class="card hero"><div class="brand">Bugünkü kişisel rota</div><h1>Bugün sana göre.</h1><div class="metrics"><div class="metric"><b>${r.total} dk</b><span>Planlanan süre</span></div><div class="metric"><b>${r.tasks.length}</b><span>Görev</span></div><div class="metric"><b>${pct}%</b><span>Tamamlandı</span></div></div><div class="why">🧠 ${r.why.join(' ')}</div><p class="tiny">${mrDayTypeLabel(d.checkin.dayType)} · ${mrPeriodLabel(d.checkin.period)} · enerji ${d.checkin.energy}/5</p></section>
  <div class="actions" style="margin:0 0 12px"><button class="btn secondary" id="edit">Durumu değiştir</button><button class="btn secondary" id="re">Yeniden analiz</button></div>
  ${r.tasks.map(x=>{let t=MR_TASKS[x.id],meta=d.doneMeta?.[x.id],tm=meta?.at?new Date(meta.at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}):'';return `<div class="task ${done.has(x.id)?'done':''}"><div class="ico">${t.icon}</div><div><h3>${t.title} · ${x.duration} dk</h3><div class="muted">${t.desc}</div><div class="reason"><b>Neden bugün?</b> ${x.reasons.length?x.reasons.join(' · '):'denge için'}${tm?`<br>✓ ${tm} · ${mrPeriodLabel(meta.period)} tamamlandı`:''}</div></div><button class="toggle" data-task="${x.id}">✓</button></div>`}).join('')}
  <section class="card"><h3>Bugünkü rota nasıldı?</h3><p>Bu geri bildirim sonraki günlerin kapasite hesabına girer.</p><div class="feedback">${[['easy','Kolaydı'],['ideal','Tam kıvamında'],['heavy','Ağır geldi']].map(x=>`<button class="fb ${d.feedback===x[0]?'sel':''}" data-f="${x[0]}">${x[1]}</button>`).join('')}</div></section>`;
  $$('[data-task]').forEach(b=>b.onclick=()=>{
    let s=new Set(d.done||[]),id=b.dataset.task;
    d.doneMeta=d.doneMeta||{};
    if(s.has(id)){s.delete(id);delete d.doneMeta[id]}
    else{s.add(id);d.doneMeta[id]={at:Date.now(),period:mrPeriodNow()}}
    d.done=[...s];mrSave();RT()
  });
  $$('[data-f]').forEach(b=>b.onclick=()=>{d.feedback=b.dataset.f;mrSave();RT()});
  $('#edit').onclick=()=>{MR.view='checkin';mrSave();R()};
  $('#re').onclick=()=>{d.route=mrBuild(k,true);mrSave();RT()}
}

function RW(){
  const k=mrToday(),b=mrBehaviorModel(k),level=b.samples<3?'Yeni öğreniyor':b.samples<10?'Öğreniyor':'Seni tanımaya başladı';
  const periodCards=['morning','day','evening'].map(p=>{let x=b.byPeriod[p];return `<div class="metric"><b>${x.samples?Math.round(x.rate*100)+'%':'—'}</b><span>${mrPeriodLabel(p)} · ${x.samples} gün</span></div>`}).join('');
  const dayCards=['work','off'].map(p=>{let x=b.byDayType[p];return `<div class="metric"><b>${x.samples?Math.round(x.rate*100)+'%':'—'}</b><span>${mrDayTypeLabel(p)} · ${x.samples} gün</span></div>`}).join('');
  const taskRows=Object.keys(MR_TASKS).map(id=>{
    const t=MR_TASKS[id],x=b.task[id];
    if(!x||x.planned<2)return '';
    const actual=b.taskCompletionPeriod[id],best=Object.entries(actual).sort((a,z)=>z[1]-a[1])[0];
    return `<div class="day"><b>${t.icon} ${t.title}</b><div class="tiny">${Math.round((x.rate||0)*100)}% tamamlama · ${x.planned} kez planlandı${best&&best[1]>=2?` · en sık ${mrPeriodLabel(best[0])} tamamlandı`:''}</div></div>`
  }).join('');
  const rows=[];for(let i=6;i>=0;i--){let dk=mrOffset(k,-i),d=MR.daily[dk],t=d?.route?.tasks?.length||0,q=d?.done?.length||0;rows.push({dk,t,q,f:d?.feedback,h:!!d?.route})}
  A.innerHTML=`<section class="card"><div class="brand">30 günlük davranış modeli</div><h1>${level}.</h1><p>Model yalnızca söylediğin hedefleri değil, gerçekten hangi gün ve saatlerde neyi tamamladığını öğrenir.</p><div class="metrics"><div class="metric"><b>${b.samples}</b><span>Öğrenilen gün</span></div><div class="metric"><b>${b.samples?Math.round(b.overall*100)+'%':'—'}</b><span>Genel tamamlama</span></div><div class="metric"><b>${b.stableMinutes||'—'}</b><span>Başarılı gün dk</span></div></div></section>
  <section class="card"><h3>Zaman dilimi performansı</h3><div class="metrics">${periodCards}</div>${b.bestCompletionPeriod?`<div class="why">⏰ Görevleri fiilen en sık <b>${mrPeriodLabel(b.bestCompletionPeriod)}</b> tamamlıyorsun.</div>`:''}</section>
  <section class="card"><h3>Çalışma / izin günü farkı</h3><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${dayCards}</div>${b.bestDayType?`<div class="why">📅 Şu ana kadar daha güçlü görünen gün tipi: <b>${mrDayTypeLabel(b.bestDayType)}</b>.</div>`:''}</section>
  <section class="card"><h3>Görev bazlı öğrenme</h3><div class="timeline">${taskRows||'<p class="muted">Henüz yeterli tekrar yok. Birkaç gün kullandıkça burada kişisel örüntüler oluşacak.</p>'}</div></section>
  <section class="card"><h3>Son 7 gün</h3><div class="timeline">${rows.map(x=>`<div class="day ${x.dk===k?'today':''}"><b>${x.dk===k?'Bugün':x.dk}</b><div class="tiny">${x.h?`${x.q}/${x.t} görev · ${x.f||'geri bildirim yok'}`:'Henüz rota yok'}</div></div>`).join('')}</div></section>`
}

function RP(){
  let p=MR.profile,b=mrBehaviorModel();
  A.innerHTML=`<section class="card"><div class="brand">Profil</div><h1>Motor seni böyle tanıyor.</h1><p>Normal gün: <b>${p.baseMinutes||'-'} dk</b></p><p>Öncelikler: <b>${(p.priorities||[]).map(x=>MR_TASKS[x]?.title).join(', ')}</b></p><p>Engel: <b>${p.blocker||'-'}</b></p><p>Öğrenilen gerçek gün: <b>${b.samples}</b></p>${b.bestCompletionPeriod?`<p>Fiilî güçlü zaman: <b>${mrPeriodLabel(b.bestCompletionPeriod)}</b></p>`:''}${b.bestDayType?`<p>Güçlü gün tipi: <b>${mrDayTypeLabel(b.bestDayType)}</b></p>`:''}<div class="why">Kalıcı profil + bugünkü durum + 30 günlük davranış geçmişi + gerçek tamamlama saatleri birlikte kullanılır.</div><div class="actions"><button class="btn secondary" id="rt">Bugünü sıfırla</button><button class="btn secondary" id="ra">Her şeyi sıfırla</button></div></section>`;
  $('#rt').onclick=()=>{delete MR.daily[mrToday()];MR.view='checkin';mrSave();R()};
  $('#ra').onclick=()=>{if(confirm('Her şey sıfırlansın mı?')){localStorage.removeItem(MR_KEY);localStorage.removeItem(MR_OLD_KEY);location.reload()}}
}
document.addEventListener('click',e=>{let b=e.target.closest('[data-view]');if(b&&MR.onboardDone){MR.view=b.dataset.view;mrSave();R()}});
R();

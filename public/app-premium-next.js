/* APP PREMIUM NEXT V2 · reference-matched presentation composition
   Presentation-only: reuses the rendered workspace and existing actions. */
(() => {
  const BODY_CLASS='app-premium-next-ready';
  let queued=false;
  const text=node=>(node?.textContent||'').trim();

  function signalByLabel(rail,label){
    return Array.from(rail?.querySelectorAll(':scope > .premium-signal')||[])
      .find(card=>text(card.querySelector('small')).toLocaleUpperCase('tr-TR')===label);
  }

  function normalizedProgress(root){
    const label=text(root.querySelector('.route-progress-summary b'));
    const match=label.match(/(\d+(?:[.,]\d+)?)/);
    if(!match)return {label:'Veri topluyor',pct:0};
    const pct=Math.max(0,Math.min(100,Number(match[1].replace(',','.'))||0));
    return {label:'%'+Math.round(pct),pct};
  }

  function ensureProgressSignal(root,rail){
    let card=rail.querySelector('.pnx-progress-signal');
    if(!card){
      card=document.createElement('div');
      card.className='premium-signal pnx-progress-signal';
      card.innerHTML='<small>GÜNLÜK İLERLEME</small><strong></strong><span>Bugünkü rota ilerlemesi</span>';
    }
    const progress=normalizedProgress(root);
    card.querySelector('strong').textContent=progress.label;
    card.style.setProperty('--pnx-progress',progress.pct+'%');
    return card;
  }

  function firstNameFromToday(){
    const h1=document.querySelector('.route-v1-head[data-premium-surface="today"] h1');
    const raw=text(h1);
    const match=raw.match(/^([^,]+),/);
    return match?.[1]?.trim()||'Öğrenci';
  }

  function enhanceShell(shell){
    const topbar=shell.querySelector('.topbar');
    if(!topbar)return;

    if(!topbar.querySelector('.pnx-global-search')){
      const search=document.createElement('button');
      search.type='button';
      search.className='pnx-global-search';
      search.dataset.action='nav';
      search.dataset.view='topics';
      search.setAttribute('aria-label','Ders ve konu aramaya git');
      search.innerHTML='<span class="pnx-search-icon" aria-hidden="true"></span><span>Ders, konu, soru ara...</span>';
      topbar.insertBefore(search,topbar.firstChild);
    }

    const right=topbar.querySelector('.topbar-right');
    const avatar=right?.querySelector('.avatar');
    if(right&&avatar&&!right.querySelector('.pnx-profile-meta')){
      const profile=document.createElement('span');
      profile.className='pnx-profile-meta';
      profile.innerHTML='<strong></strong><small>Öğrenci</small>';
      profile.querySelector('strong').textContent=firstNameFromToday();
      avatar.insertAdjacentElement('afterend',profile);
    }
  }

  function polishHeading(header){
    const h1=header.querySelector('h1');
    if(!h1||h1.dataset.pnxTitle==='1')return;
    const current=text(h1);
    const match=current.match(/^(.*?)(?:,\s*)?Bugünkü Rotan\.?$/i);
    if(match){
      const name=(match[1]||'').trim().replace(/,\s*$/,'');
      h1.textContent=(name?name+', ':'')+'bugünkü rotan hazır. 👋';
    }
    h1.dataset.pnxTitle='1';
  }

  function enhanceHeroHeader(header){
    if(header.querySelector('.pnx-hero-side'))return;
    const date=text(header.querySelector('.eyebrow'));
    const side=document.createElement('aside');
    side.className='pnx-hero-side';
    side.innerHTML=
      '<blockquote>“Küçük adımlar,<br>büyük sonuçlar doğurur.”</blockquote>'+
      '<div class="pnx-date-card"><span class="pnx-date-icon" aria-hidden="true"></span><div><strong></strong><small>Bugünün rotası</small></div></div>'+
      '<span class="pnx-hero-note">Daha iyi bir sen mümkün. ✨</span>';
    side.querySelector('.pnx-date-card strong').textContent=date||'Bugün';
    header.appendChild(side);
  }

  function labelSignals(rail){
    Array.from(rail.children).forEach(card=>{
      const label=text(card.querySelector('small')).toLocaleUpperCase('tr-TR');
      card.classList.toggle('pnx-signal-today',label==='BUGÜN');
      card.classList.toggle('pnx-signal-load',label==='KALAN YÜK');
      card.classList.toggle('pnx-signal-mode',label==='ROTA MODU');
    });
  }

  function enhanceFocusHero(hero,list){
    if(hero.dataset.pnxFocus==='1')return;
    const grow=hero.querySelector(':scope > .grow');
    const total=hero.querySelector(':scope > .route-total');
    const start=hero.querySelector(':scope > .route-start-big');
    if(!grow||!total||!start)return;

    const firstTask=list.querySelector('.route-task:not(.is-done)')||list.querySelector('.route-task');
    const reasonText=text(firstTask?.querySelector('.route-task-reason'));
    const meta=text(grow.querySelector('p'));
    const minuteMatch=meta.match(/(\d+)\s*dk/i);
    const minutes=minuteMatch?Number(minuteMatch[1]):40;

    const layout=document.createElement('div');
    layout.className='pnx-focus-layout';
    const left=document.createElement('div');
    left.className='pnx-focus-left';
    const label=document.createElement('div');
    label.className='pnx-next-label';
    label.innerHTML='<span aria-hidden="true"></span><strong>Sıradaki görev</strong>';
    left.append(label,grow);
    if(reasonText){
      const reason=document.createElement('div');
      reason.className='pnx-hero-reason';
      reason.innerHTML='<span aria-hidden="true">“</span><p></p>';
      reason.querySelector('p').textContent=reasonText;
      left.appendChild(reason);
    }
    left.appendChild(start);

    const right=document.createElement('div');
    right.className='pnx-focus-right';
    right.appendChild(total);
    const timer=document.createElement('div');
    timer.className='pnx-focus-timer';
    timer.innerHTML=
      '<div class="pnx-timer-ring"><strong></strong><button type="button" aria-label="Odak oturumunu başlat"><span></span></button></div>'+
      '<small>Pomodoro ile başla</small>'+
      '<p>Disiplini, hayallerini gerçeğe dönüştürür. ✨</p>';
    timer.querySelector('.pnx-timer-ring strong').textContent=String(minutes).padStart(2,'0')+':00';
    const play=timer.querySelector('button');
    play.dataset.action='focus-session';
    if(start.dataset.id)play.dataset.id=start.dataset.id;
    right.appendChild(timer);

    layout.append(left,right);
    hero.appendChild(layout);
    hero.dataset.pnxFocus='1';
  }

  function enhanceRoutePanel(panel,listHead,list){
    if(panel.dataset.pnxPanel==='1')return;
    const count=text(listHead.querySelector('h2'));
    const status=listHead.querySelector('.route-list-status');
    const eyebrow=listHead.querySelector('.eyebrow');
    const title=listHead.querySelector('h2');
    if(eyebrow)eyebrow.textContent='BUGÜNÜN ROTASI';
    if(title)title.textContent='Bugünün Rotası';
    if(status)status.textContent=(count||'Bugünkü görevler')+' seni bekliyor.';

    const all=document.createElement('button');
    all.type='button';
    all.className='pnx-view-all';
    all.dataset.action='nav';
    all.dataset.view='plan';
    all.textContent='Tümünü gör →';
    listHead.appendChild(all);

    Array.from(list.children).forEach((task,index)=>{
      if(!task.classList.contains('route-task'))return;
      task.style.setProperty('--pnx-order',String(index+1));
      task.classList.add('pnx-order-'+String((index%4)+1));
    });
    panel.dataset.pnxPanel='1';
  }

  function buildModeCard(mode){
    const card=document.createElement('article');
    card.className='pnx-mode-card';
    const value=text(mode?.querySelector('strong'))||'DENGE';
    const detail=text(mode?.querySelector('span'))||'Yük ve tekrar dengeleniyor';
    card.innerHTML=
      '<header><span class="pnx-card-icon pnx-layers-icon" aria-hidden="true"></span><strong>Rota modu</strong><button type="button" data-action="nav" data-view="settings">Modu değiştir</button></header>'+
      '<div class="pnx-mode-body"><span class="pnx-mode-glyph" aria-hidden="true">▥</span><div><strong></strong><small></small></div></div>'+
      '<p>Bugünkü rota, çalışma yükün ve tekrar ihtiyacın birlikte değerlendirilerek dengeleniyor.</p>';
    card.querySelector('.pnx-mode-body strong').textContent=value;
    card.querySelector('.pnx-mode-body small').textContent=detail;
    return card;
  }

  function buildTeacherCard(){
    const card=document.createElement('article');
    card.className='pnx-today-teacher';
    card.innerHTML=
      '<div class="pnx-teacher-copy">'+
        '<header><span class="pnx-spark" aria-hidden="true">✦</span><strong>Rota Hoca</strong><span>→</span></header>'+
        '<p>Bugünkü rotanı ve son eksiklerini biliyorum.</p>'+
        '<div class="pnx-teacher-actions">'+
          '<button type="button" data-action="nav" data-view="teacher">Soru sor</button>'+
          '<button type="button" data-action="nav" data-view="teacher">Daha basit anlat</button>'+
        '</div>'+
      '</div>'+
      '<div class="pnx-teacher-visual"><span>Nasıl yardımcı olabilirim?</span><img src="/rota-hoca-avatar.jpg" alt="Rota Hoca"></div>';
    return card;
  }

  function transformReason(reason,mode,target){
    if(!reason||reason.dataset.pnxReason==='1')return;
    const kicker=reason.querySelector('.route-reason-kicker');
    const heading=reason.querySelector('strong');
    const original=text(reason.querySelector('p'));
    if(kicker)kicker.textContent='NEDEN BUGÜN?';
    if(heading){
      heading.textContent='Neden bugün?';
      if(!reason.querySelector('.pnx-legacy-reason-label')){
        const legacy=document.createElement('span');
        legacy.className='sr-only pnx-legacy-reason-label';
        legacy.textContent='Bu plan neden böyle?';
        heading.insertAdjacentElement('afterend',legacy);
      }
    }

    const candidates=[
      original,
      text(mode?.querySelector('span')),
      [text(target?.querySelector('strong')),text(target?.querySelector('span'))].filter(Boolean).join(' · ')
    ].filter(Boolean);
    const unique=[...new Set(candidates)].slice(0,3);
    const list=document.createElement('div');
    list.className='pnx-reason-list';
    unique.forEach(value=>{
      const row=document.createElement('div');
      row.innerHTML='<span aria-hidden="true">✓</span><p></p>';
      row.querySelector('p').textContent=value;
      list.appendChild(row);
    });
    const body=reason.querySelector('.grow');
    body?.appendChild(list);
    reason.dataset.pnxReason='1';
  }

  function composeToday(header){
    const root=header.closest('.content')||header.parentElement;
    if(!root)return;

    document.body.classList.add(BODY_CLASS);
    polishHeading(header);
    enhanceHeroHeader(header);

    const command=root.querySelector('.route-command-grid');
    const rail=command?.querySelector('.premium-signal-rail');
    const hero=command?.querySelector('.route-today-hero')||root.querySelector('.route-today-hero');
    const listHead=root.querySelector('.route-list-head');
    const list=root.querySelector('.route-list');
    const reason=root.querySelector('.route-reason.route-coach-insight')||root.querySelector('.route-coach-insight');
    if(!command||!rail||!hero||!listHead||!list)return;

    const progress=ensureProgressSignal(root,rail);
    const today=signalByLabel(rail,'BUGÜN');
    const load=signalByLabel(rail,'KALAN YÜK');
    const mode=signalByLabel(rail,'ROTA MODU');
    const target=signalByLabel(rail,'HEDEF SİNYALİ');

    [today,load,progress,mode].filter(Boolean).forEach(card=>rail.appendChild(card));
    labelSignals(rail);

    if(header.dataset.pnxMounted!=='1'){
      const stage=document.createElement('section');
      stage.className='pnx-stage';
      stage.setAttribute('aria-label','Bugünün ana çalışma alanı');

      const primary=document.createElement('div');
      primary.className='pnx-primary';
      primary.appendChild(hero);

      const routePanel=document.createElement('aside');
      routePanel.className='pnx-route-panel';
      routePanel.setAttribute('aria-label','Bugünün Rotası');
      routePanel.append(listHead,list);

      stage.append(primary,routePanel);
      command.insertAdjacentElement('afterend',stage);

      enhanceFocusHero(hero,list);
      enhanceRoutePanel(routePanel,listHead,list);
      transformReason(reason,mode,target);

      const intel=document.createElement('section');
      intel.className='pnx-intel-strip';
      intel.setAttribute('aria-label','Rota kararının açıklaması');
      if(reason)intel.appendChild(reason);
      intel.appendChild(buildModeCard(mode));
      intel.appendChild(buildTeacherCard());
      stage.insertAdjacentElement('afterend',intel);

      if(target)target.remove();
      header.dataset.pnxMounted='1';
    }

    root.querySelectorAll('.route-task').forEach(task=>{
      const done=task.querySelector('.check-btn.done');
      task.classList.toggle('pnx-task-done',!!done);
    });
  }

  function sync(){
    queued=false;
    const shell=document.querySelector('.app-shell');
    const header=document.querySelector('.route-v1-head[data-premium-surface="today"]');
    document.body.classList.toggle(BODY_CLASS,!!shell);
    if(shell)enhanceShell(shell);
    if(header)composeToday(header);
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(sync);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',schedule,{once:true});
  }else{
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class']
  });
})();

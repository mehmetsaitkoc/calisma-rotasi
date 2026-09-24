/* FINAL PREMIUM LANDING · REFERENCE MATCH
   Rebuilds only the public welcome surface as real DOM.
   Existing data-action contracts keep onboarding and product navigation intact. */
(() => {
  let mounted = null;

  const el = (tag, cls = '', text = '') => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  const icon = (name) => {
    const paths = {
      arrow:'M7 17 17 7M7 7h10v10',
      play:'m8 4 12 8-12 8Z',
      user:'M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
      chart:'M4 20V10m6 10V4m6 16v-7m5 7H3',
      refresh:'M20 11a8 8 0 1 0 2 5M20 4v7h-7',
      star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
      cap:'m2 9 10-5 10 5-10 5L2 9Zm4 3v5c3 3 9 3 12 0v-5',
      book:'M4 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H4Zm16 0h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6Z',
      shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z',
      bolt:'m13 2-8 11h6l-1 9 9-12h-6Z'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.classList.add('v6-icon');
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',paths[name] || paths.arrow);
    svg.appendChild(p);
    return svg;
  };

  const button = (label, action, cls = '', attrs = {}) => {
    const b = el('button', cls, label);
    b.type = 'button';
    if (action) b.dataset.action = action;
    for (const [k,v] of Object.entries(attrs)) b.dataset[k] = v;
    return b;
  };

  function brand(){
    const wrap = el('div','v6-brand');
    const mark = el('span','v6-brand-mark','R');
    const type = el('span','v6-brand-type');
    type.append(el('strong','', 'Çalışma Rotası'), el('small','', 'Daha iyi bir sen, mümkün.'));
    wrap.append(mark,type);
    return wrap;
  }

  function topNav(welcome){
    const nav = el('nav','v6-topbar');
    const brandBtn = button('', 'select', 'v6-brand-button');
    brandBtn.append(brand());

    const links = el('div','v6-nav-links');
    const anchor = (text, cls = '') => {
      const a = el('button','v6-nav-link '+cls,text);
      a.type='button';
      return a;
    };
    const home = anchor('Ana Sayfa','active');
    const how = anchor('Nasıl Çalışır?');
    const features = anchor('Özellikler');
    const plans = anchor('Ücretsiz Beta');
    home.addEventListener('click',()=>welcome.scrollIntoView({behavior:'smooth',block:'start'}));
    how.addEventListener('click',()=>welcome.querySelector('.v6-feature-strip')?.scrollIntoView({behavior:'smooth',block:'center'}));
    features.addEventListener('click',()=>welcome.querySelector('.v6-dashboard')?.scrollIntoView({behavior:'smooth',block:'center'}));
    plans.addEventListener('click',()=>welcome.querySelector('.v6-prep-grid')?.scrollIntoView({behavior:'smooth',block:'center'}));
    links.append(home,how,features,plans);

    const actions = el('div','v6-nav-actions');
    const workspace = button('Web Beta',null,'v6-outline-btn',{accountAction:'open'});
    const start = button('Ücretsiz Başla →',null,'v6-gradient-btn');
    start.addEventListener('click',()=>welcome.querySelector('.v6-prep-card.kpss')?.click());
    actions.append(workspace,start);

    nav.append(brandBtn,links,actions);
    return nav;
  }

  function heroCopy(){
    const copy = el('section','v6-hero-copy');
    const badge = el('div','v6-hero-badge');
    badge.append(el('i'),el('span','', 'Ücretsiz Web Beta · Sana özel KPSS rotası'));

    const h1 = el('h1');
    h1.append(document.createTextNode('Kişisel Çalışma'));
    h1.append(el('br'));
    h1.append(el('span','v6-gradient-word','Rotanı'));
    h1.append(document.createTextNode(' Keşfet'));

    const slogan = el('div','v6-slogan');
    slogan.append(
      el('span','v6-slogan-line','Herkesin çalışma programı'),
      el('span','v6-slogan-gradient','aynı olmak zorunda değil.')
    );

    const p = el('p','v6-hero-copytext','Çalışma Rotası, hedeflerine, seviyene ve zamanına göre sana özel çalışma planı oluşturur. Daha verimli, daha bilinçli, daha senin gibi.');

    const actions = el('div','v6-hero-actions');
    const start = button('Ücretsiz Başla →',null,'v6-gradient-btn v6-main-cta');
    start.addEventListener('click',()=>document.querySelector('.v6-prep-card.kpss')?.click());
    const video = el('button','v6-video-btn');
    video.type='button';
    const play = el('span','v6-play'); play.append(icon('chart'));
    video.append(play,el('strong','', 'Örnek Paneli Gör'));
    video.addEventListener('click',()=>document.querySelector('.v6-dashboard')?.scrollIntoView({behavior:'smooth',block:'center'}));
    actions.append(start,video);

    const features = el('div','v6-feature-strip');
    [
      ['user','Kişiye Özel Plan',true],
      ['chart','Akıllı Analiz',true],
      ['refresh','Sürekli Takip',true],
      ['refresh','3 + 7 Gün Tekrar',false]
    ].forEach(([ic,t,proof])=>{
      const item=el('span','v6-feature-item'+(proof?' premium-proof-item':'')); item.append(icon(ic),el('b','',t)); features.append(item);
    });

    copy.append(badge,h1,slogan,p,actions,features);
    return copy;
  }

  function journey(){
    const art = el('aside','v6-journey');
    art.setAttribute('aria-label','Hedefe uzanan çalışma rotası');
    const handwriting = el('div','v6-handwriting','Daha iyi\nbir sen\nmümkün.');
    const pillars = el('div','v6-pillars');
    [
      ['chart','PLAN'],
      ['shield','DİSİPLİN'],
      ['refresh','İSTİKRAR'],
      ['star','BAŞARI']
    ].forEach(([ic,t])=>{
      const chip=el('span','v6-pillar-chip');
      chip.append(icon(ic),el('b','',t));
      pillars.append(chip);
    });
    art.append(handwriting,pillars);
    return art;
  }

  function donut(value, cls=''){
    const wrap=el('div','v6-donut '+cls);
    wrap.style.setProperty('--pct',String(value));
    wrap.append(el('span','',value+'%'));
    return wrap;
  }

  function statCard(title,value,sub,kind){
    const card=el('article','v6-stat-card');
    const titleEl=el('small','',title);
    const row=el('div','v6-stat-row');
    row.append(el('strong','',value));
    if(kind==='plan') row.append(donut(71,'cyan'));
    if(kind==='net'){
      const bars=el('span','v6-mini-bars');
      [35,58,84].forEach(h=>{const i=el('i');i.style.height=h+'%';bars.append(i);});
      row.append(bars);
    }
    if(kind==='target') row.append(el('span','v6-target-ring'));
    card.append(titleEl,row,el('span','v6-stat-sub',sub));
    return card;
  }

  function dashboard(){
    const dash=el('section','v6-dashboard');
    dash.setAttribute('aria-label','Çalışma Rotası örnek öğrenci paneli');
    const demo=el('span','v6-demo-badge','Örnek görünüm');
    dash.append(demo);

    const sidebar=el('aside','v6-dash-sidebar');
    const dashBrand=el('div','v6-dash-brand'); dashBrand.append(el('span','v6-dash-mark','R'),el('strong','', 'Çalışma Rotası'));
    sidebar.append(dashBrand);
    [
      ['⌂','Ana Sayfa','active'],['□','Planım',''],['⌁','Ders Analizi',''],['✓','Denemeler',''],
      ['♡','Hedeflerim',''],['◇','Kaynaklar',''],['▧','Notlar',''],['⚙','Ayarlar','']
    ].forEach(([ic,t,a])=>{
      const item=el('div','v6-dash-nav '+a); item.append(el('span','',ic),el('b','',t)); sidebar.append(item);
    });

    const main=el('div','v6-dash-main');
    const top=el('div','v6-dash-top');
    const search=el('div','v6-search','Ders, konu veya hedef ara...');
    const profile=el('div','v6-profile'); profile.append(el('span','v6-avatar','KA'),el('div','v6-profile-text'));
    profile.lastElementChild.append(el('strong','', 'KPSS Adayı'),el('small','', 'Lisans · GY–GK'));
    top.append(search,profile);

    const hello=el('div','v6-hello');
    hello.append(el('div','', 'Merhaba, KPSS Adayı 👋'),el('small','', 'Bugün hedeflerine bir adım daha yaklaş.'));
    const quote=el('div','v6-dash-quote','Disiplin, hayalleri gerçeğe dönüştürür.');

    const head=el('div','v6-dash-head'); head.append(hello,quote);

    const stats=el('div','v6-stat-grid');
    stats.append(
      statCard('Bugünkü Plan','5/7','Tamamlanan görev','plan'),
      statCard('Net Gelişimi','+18','Son 4 denemeye göre','net'),
      statCard('Hedefe Kalan','64 gün','KPSS hedefi','target')
    );

    const lower=el('div','v6-dash-lower');
    const perf=el('article','v6-panel v6-performance');
    const perfHead=el('div','v6-panel-head'); perfHead.append(el('strong','', 'Ders Performansım'),el('span','', 'Tümünü Gör →')); perf.append(perfHead);
    [
      ['Matematik',78,'blue'],['Türkçe',62,'blue2'],['Tarih',54,'cyan'],['Coğrafya',71,'violet'],['Vatandaşlık',68,'warm']
    ].forEach(([name,val,cls])=>{
      const row=el('div','v6-perf-row'); row.append(el('span','',name));
      const track=el('i','v6-perf-track'); const fill=el('b','v6-perf-fill '+cls); fill.style.width=val+'%'; track.append(fill);
      row.append(track,el('em','', '%'+val)); perf.append(row);
    });

    const week=el('article','v6-panel v6-week');
    const weekHead=el('div','v6-panel-head'); weekHead.append(el('strong','', 'Bu Hafta'),el('span','', 'Tümünü Gör →')); week.append(weekHead);
    const bubble=el('div','v6-week-bubble','6 saat 20 dk'); week.append(bubble);
    const bars=el('div','v6-week-bars');
    const vals=[36,52,72,58,80,62,48];
    ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].forEach((d,i)=>{
      const col=el('div','v6-week-col'); const bar=el('i');bar.style.height=vals[i]+'%';col.append(bar,el('span','',d));bars.append(col);
    });
    week.append(bars);
    lower.append(perf,week);

    const foot=el('div','v6-dash-foot');
    const motivational=el('div','v6-dash-mot'); motivational.append(icon('bolt'),el('div'));
    motivational.lastElementChild.append(el('strong','', 'Küçük adımlar, büyük sonuçlar.'),el('span','', 'Bugün de hedeflerine bir adım daha yaklaş.'));
    const task=el('button','v6-dash-task','Bugünün görevlerine başla →');task.type='button';task.addEventListener('click',()=>document.querySelector('.v6-prep-card.kpss')?.click());
    foot.append(motivational,task);

    main.append(top,head,stats,lower,foot);
    dash.append(sidebar,main);
    return dash;
  }

  function prepArt(){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 240 130');
    svg.setAttribute('aria-hidden','true');
    svg.classList.add('v6-prep-art','kpss');
    const path=document.createElementNS(ns,'path');
    path.setAttribute('fill','none');
    path.setAttribute('stroke','currentColor');
    path.setAttribute('stroke-width','3');
    path.setAttribute('stroke-linecap','round');
    path.setAttribute('stroke-linejoin','round');
    path.setAttribute('d','M18 112h204M36 112V58h168v54M30 58h180L120 20 30 58Zm24 54V72m33 40V72m33 40V72m33 40V72m33 40V72M44 88h152M44 102h152');
    svg.append(path);
    return svg;
  }

  function prepCard(exam,title,desc,kind){
    const b=button('', 'choose-exam', 'v6-prep-card '+kind, {exam});
    const iconWrap=el('span','v6-prep-icon'); iconWrap.append(icon('book'));
    const copy=el('span','v6-prep-copy'); copy.append(el('strong','',title),el('small','',desc));
    const arrow=el('span','v6-prep-arrow'); arrow.append(icon('arrow'));
    b.append(prepArt(),iconWrap,copy,arrow);
    return b;
  }

  function trust(){
    const box=el('aside','v6-trust premium-trust-strip');
    box.append(el('div','v6-trust-quote','“Doğru plan,\nbüyük fark yaratır.”'));
    const line=el('div','v6-trust-line');
    [
      ['book','KPSS odaklı','Tek çalışma alanı'],
      ['chart','Akıllı rota','Kişiye özel'],
      ['refresh','3 + 7 gün','Tekrar döngüsü']
    ].forEach(([ic,n,label])=>{
      const item=el('div','v6-trust-item');item.append(icon(ic),el('strong','',n),el('span','',label));line.append(item);
    });
    box.append(line);
    return box;
  }

  function build(welcome){
    if(welcome.dataset.pixelMatch==='1') return;
    welcome.dataset.pixelMatch='1';
    welcome.setAttribute('data-premium-surface','welcome');
    welcome.classList.add('premium-landing-final');
    welcome.textContent='';

    const nav=topNav(welcome);
    const main=el('main','v6-page');
    const hero=el('section','v6-hero');
    hero.append(heroCopy(),journey(),dashboard());

    const lower=el('section','v6-lower');
    const cards=el('div','v6-prep-grid');
    cards.classList.add('kpss-only-grid');
    cards.append(
      prepCard('kpss','KPSS Rotanı Kur','Lisans GY–GK için kişisel planını oluştur ve çalıştıkça rotanı geliştir.','kpss')
    );
    lower.append(cards,trust());

    main.append(hero,lower);
    welcome.append(nav,main);
    mounted=welcome;
  }

  function mount(){
    const welcome=document.querySelector('.welcome');
    if(!welcome){mounted=null;return;}
    const isPublicWelcome=welcome.dataset.pixelMatch==='1'||!!welcome.querySelector('.welcome-main[data-premium-surface="welcome"]');
    if(!isPublicWelcome){mounted=welcome;return;}
    build(welcome);
  }

  const schedule=()=>requestAnimationFrame(mount);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();

  new MutationObserver(()=>{
    const w=document.querySelector('.welcome');
    const eligible=!!w&&(w.dataset.pixelMatch==='1'||!!w.querySelector('.welcome-main[data-premium-surface="welcome"]'));
    if(w!==mounted || (eligible && w.dataset.pixelMatch!=='1')) schedule();
  }).observe(document.documentElement,{subtree:true,childList:true});
})();

/* APP PREMIUM NEXT LOADER · keeps the large workspace HTML untouched */
(() => {
  if (!document.querySelector('script[data-color-mode]')) {
    const mode = document.createElement('script');
    mode.src = '/color-mode.js?v=1';
    mode.async = false;
    mode.dataset.colorMode = '1';
    document.head.appendChild(mode);
  }
  if (!document.querySelector('link[data-app-premium-next]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/app-premium-next.css?v=1';
    css.dataset.appPremiumNext = '1';
    document.head.appendChild(css);
  }
  if (!document.querySelector('script[data-app-premium-next]')) {
    const script = document.createElement('script');
    script.src = '/app-premium-next.js?v=1';
    script.async = false;
    script.dataset.appPremiumNext = '1';
    document.head.appendChild(script);
  }
  if (!document.querySelector('script[data-kpss-only]')) {
    const product = document.createElement('script');
    product.src = '/kpss-only.js?v=1';
    product.async = false;
    product.dataset.kpssOnly = '1';
    document.head.appendChild(product);
  }
  // One shared system and one dashboard composition; no application state ownership.
  ['/rota-foundations.css?v=8', '/rota-dashboard.css?v=8'].forEach((href) => {
    if (document.querySelector('link[href="' + href + '"]')) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = href;
    document.head.appendChild(style);
  });
})();

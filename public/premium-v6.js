/* PREMIUM UI V6 · LIVE FIX
   Welcome-only presentation layer. Route Engine, state, storage and entitlement logic are unchanged. */
(() => {
  let mounted = null;

  const node = (tag, className = '', text = '') => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  };

  const metric = (label, value, sub = '') => {
    const box = node('div', 'v6-metric');
    box.append(node('small', '', label), node('strong', '', value));
    if (sub) box.append(node('span', '', sub));
    return box;
  };

  function rewriteHeading(copy) {
    const eyebrow = copy.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'SANA ÖZEL · DAHA AKILLI · DAHA ETKİLİ';

    const h1 = copy.querySelector('h1');
    if (h1) {
      h1.textContent = '';
      h1.append(document.createTextNode('Kişisel Çalışma'));
      h1.append(node('br'));
      h1.append(node('span', 'v6-gradient-word', 'Rotanı'));
      h1.append(document.createTextNode(' Keşfet'));
    }

    const brand = copy.querySelector('.hero-brand-line');
    if (brand) {
      brand.textContent = '';
      brand.append(
        node('span', 'v6-slogan-top', 'Herkesin çalışma programı'),
        node('span', 'v6-slogan-bottom', 'aynı olmak zorunda değil.')
      );
    }

    const desc = copy.querySelector('.welcome-copy');
    if (desc) {
      desc.textContent = 'Rota; hedeflerine, seviyene ve zamanına göre sana özel çalışma planı oluşturur. Daha verimli, daha bilinçli, daha senin gibi.';
    }
  }

  function buildActions(copy, welcome) {
    if (copy.querySelector('.v6-hero-actions')) return;

    const actions = node('div', 'v6-hero-actions');
    const cta = node('button', 'v6-primary-cta', 'Rotamı Oluştur →');
    cta.type = 'button';
    cta.addEventListener('click', () => {
      welcome.querySelector('.exam-grid')?.scrollIntoView({behavior:'smooth', block:'center'});
    });
    actions.append(cta, node('span', 'v6-cta-note', 'KPSS veya YKS seçerek hemen başla'));
    copy.append(actions);

    const features = node('div', 'v6-feature-row');
    ['Kişiye özel plan','Akıllı analiz','Sürekli takip','3–7 gün tekrar'].forEach(t => features.append(node('span', '', t)));
    copy.append(features);
  }

  function buildJourney() {
    const journey = node('aside', 'v6-journey-card');
    journey.setAttribute('aria-label', 'Hedefe uzanan kişisel çalışma rotası görseli');
    const badge = node('div', 'v6-journey-badge', 'KÜÇÜK ADIMLAR · BÜYÜK HEDEFLER');
    const quote = node('div', 'v6-journey-quote');
    quote.append(node('strong', '', 'Plan'), node('span', '', 'Disiplin · İstikrar · İlerleme'));
    journey.append(badge, quote);
    return journey;
  }

  function buildAnalysis() {
    const panel = node('aside', 'welcome-live-console');
    panel.setAttribute('aria-label', 'Çalışma Rotası örnek analiz görünümü');

    const top = node('div', 'console-top');
    const live = node('span', 'console-live');
    live.append(node('i'), document.createTextNode(' ROTA SENİ ANALİZ EDER'));
    top.append(live, node('span', 'console-example', 'ÖRNEK GÖRÜNÜM'));

    const head = node('div', 'v6-analysis-head');
    const titleWrap = node('div');
    titleWrap.append(node('small', '', 'KİŞİSEL ROTA'), node('h3', '', 'Veriyi karara dönüştürür.'));
    head.append(titleWrap, node('span', 'v6-status-pill', 'GÜNCEL'));

    const metrics = node('div', 'v6-metrics');
    metrics.append(
      metric('MEVCUT NET', '67', 'örnek değer'),
      metric('HEDEF NET', '85', 'örnek değer'),
      metric('ROTA DURUMU', 'Dengeleniyor', 'yük + öncelik')
    );

    const chart = node('div', 'v6-chart-card');
    const chartTop = node('div', 'v6-chart-top');
    chartTop.append(node('strong', '', 'Net gelişimi'), node('span', '', 'Hedefe göre rota'));
    const bars = node('div', 'v6-chart-bars');
    [28,38,47,44,59,67,74].forEach((height, i) => {
      const bar = node('i');
      bar.style.height = height + '%';
      if (i === 6) bar.className = 'active';
      bars.append(bar);
    });
    chart.append(chartTop, bars);

    const signal = node('div', 'v6-signal-line');
    ['Hedef farkı','Son deneme','Yanlışlar','3/7 tekrar'].forEach(t => signal.append(node('span', '', t)));

    const note = node('p', 'v6-analysis-note', 'Bu panel ürünün analiz mantığını örnekler; gerçek rota kendi çalışma verilerinle oluşur.');

    panel.append(top, head, metrics, chart, signal, note);
    return panel;
  }

  function transformLegacyHero(welcome) {
    const main = welcome.querySelector('.welcome-main');
    if (!main || main.querySelector('.welcome-hero-shell')) return;

    const intro = main.querySelector('.welcome-intro');
    if (!intro) return;

    const shell = node('section', 'welcome-hero-shell');
    const copy = node('div', 'welcome-hero-copy');

    const introMain = intro.firstElementChild;
    const introCopy = intro.querySelector('.welcome-copy');

    if (introMain) {
      while (introMain.firstChild) copy.append(introMain.firstChild);
    }
    if (introCopy) copy.append(introCopy);

    shell.append(copy, buildJourney(), buildAnalysis());
    main.insertBefore(shell, intro);
    intro.remove();
  }

  function mountWelcome() {
    const welcome = document.querySelector('.welcome');
    if (!welcome) {
      mounted = null;
      return;
    }

    welcome.classList.add('premium-v6');
    transformLegacyHero(welcome);

    const copy = welcome.querySelector('.welcome-hero-copy');
    if (copy && copy.dataset.premiumV6 !== '1') {
      copy.dataset.premiumV6 = '1';
      rewriteHeading(copy);
      buildActions(copy, welcome);
    }

    const small = welcome.querySelector('.step-indicator .small');
    if (small) small.textContent = 'Hangi yola çıkmak istiyorsun?';
    const tiny = welcome.querySelector('.step-indicator .tiny');
    if (tiny) tiny.textContent = 'Diğer sınava istediğin zaman geçebilirsin.';

    mounted = welcome;
  }

  const schedule = () => requestAnimationFrame(mountWelcome);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  } else {
    schedule();
  }

  new MutationObserver(() => {
    const current = document.querySelector('.welcome');
    if (current !== mounted || (current && !current.classList.contains('premium-v6'))) schedule();
  }).observe(document.documentElement, {subtree:true, childList:true});
})();
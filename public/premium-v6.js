/* PREMIUM UI V6 · MIDNIGHT JOURNEY */
(() => {
  let mounted = null;

  function addSpan(parent, className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    parent.appendChild(span);
    return span;
  }

  function mountWelcome() {
    const welcome = document.querySelector('.welcome');
    if (!welcome) { mounted = null; return; }
    welcome.classList.add('premium-v6');

    const hero = welcome.querySelector('.welcome-hero-shell');
    if (!hero) return;

    const copy = hero.querySelector('.welcome-hero-copy') || hero.firstElementChild;
    if (copy && copy.dataset.premiumV6 !== '1') {
      copy.dataset.premiumV6 = '1';

      const eyebrow = copy.querySelector('.eyebrow');
      if (eyebrow) eyebrow.textContent = 'SANA ÖZEL · DAHA AKILLI · DAHA ETKİLİ';

      const h1 = copy.querySelector('h1');
      if (h1) {
        h1.textContent = '';
        h1.append(document.createTextNode('Kişisel Çalışma'));
        h1.appendChild(document.createElement('br'));
        addSpan(h1, 'v6-gradient-word', 'Rotanı');
        h1.append(document.createTextNode(' Keşfet'));
      }

      const brand = copy.querySelector('.hero-brand-line');
      if (brand) {
        brand.textContent = '';
        addSpan(brand, 'v6-slogan-top', 'Herkesin çalışma programı');
        addSpan(brand, 'v6-slogan-bottom', 'aynı olmak zorunda değil.');
      }

      const desc = copy.querySelector('.welcome-copy');
      if (desc) desc.textContent = 'Rota; hedeflerine, seviyene ve zamanına göre sana özel çalışma planı oluşturur. Daha verimli, daha bilinçli, daha senin gibi.';

      const chips = copy.querySelector('.welcome-hero-chips');
      if (chips) {
        chips.textContent = '';
        ['Kişiye özel plan','Akıllı analiz','Sürekli takip'].forEach(t => addSpan(chips, '', t));
      }

      const actions = document.createElement('div');
      actions.className = 'v6-hero-actions';
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'v6-primary-cta';
      cta.textContent = 'Rotamı Oluştur →';
      const note = document.createElement('span');
      note.className = 'v6-cta-note';
      note.textContent = 'KPSS veya YKS seçerek hemen başla';
      actions.append(cta, note);
      copy.appendChild(actions);

      const featureRow = document.createElement('div');
      featureRow.className = 'v6-feature-row';
      ['Hedef farkını okur','Yükünü dengeler','Çalıştıkça değişir'].forEach(t => addSpan(featureRow, '', t));
      copy.appendChild(featureRow);

      cta.addEventListener('click', () => welcome.querySelector('.exam-grid')?.scrollIntoView({behavior:'smooth', block:'center'}));
    }

    if (!hero.querySelector('.v6-journey-card')) {
      const journey = document.createElement('aside');
      journey.className = 'v6-journey-card';
      journey.setAttribute('aria-hidden', 'true');
      const consolePanel = hero.querySelector('.welcome-live-console');
      if (consolePanel) hero.insertBefore(journey, consolePanel);
      else hero.appendChild(journey);
    }

    const consolePanel = hero.querySelector('.welcome-live-console');
    if (consolePanel && consolePanel.dataset.premiumV6 !== '1') {
      consolePanel.dataset.premiumV6 = '1';
      const live = consolePanel.querySelector('.console-live');
      if (live) {
        live.textContent = '';
        const dot = document.createElement('i');
        live.append(dot, document.createTextNode(' ROTA SENİ ANALİZ EDER'));
      }
      const example = consolePanel.querySelector('.console-example');
      if (example) example.textContent = 'GÜNCEL DURUM';
      const small = consolePanel.querySelector('.console-card small');
      if (small) small.textContent = 'KİŞİSEL ROTA KARARI';
    }

    const choiceHead = welcome.querySelector('.welcome-choice-head .small');
    if (choiceHead) choiceHead.textContent = 'Hangi yola çıkmak istiyorsun?';

    mounted = welcome;
  }

  function scheduleMount(){ requestAnimationFrame(mountWelcome); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleMount, {once:true});
  else scheduleMount();

  new MutationObserver(() => {
    const root = document.querySelector('.welcome');
    if (root !== mounted || (root && !root.classList.contains('premium-v6'))) scheduleMount();
  }).observe(document.documentElement, {subtree:true, childList:true});
})();
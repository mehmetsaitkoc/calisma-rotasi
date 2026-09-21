/* APP PREMIUM NEXT V1 · presentation-only DOM composition
   Moves existing rendered nodes; does not read or mutate Route Engine state. */
(() => {
  const BODY_CLASS = 'app-premium-next-ready';
  let queued = false;

  const text = (node) => (node?.textContent || '').trim();

  function signalByLabel(rail, label) {
    return Array.from(rail?.querySelectorAll(':scope > .premium-signal') || [])
      .find((card) => text(card.querySelector('small')).toLocaleUpperCase('tr-TR') === label);
  }

  function normalizedProgress(root) {
    const label = text(root.querySelector('.route-progress-summary b'));
    const match = label.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return { label: 'Veri topluyor', pct: 0 };
    const pct = Math.max(0, Math.min(100, Number(match[1].replace(',', '.')) || 0));
    return { label: '%' + Math.round(pct), pct };
  }

  function ensureProgressSignal(root, rail) {
    let card = rail.querySelector('.pnx-progress-signal');
    if (!card) {
      card = document.createElement('div');
      card.className = 'premium-signal pnx-progress-signal';
      card.innerHTML = '<small>GÜNLÜK İLERLEME</small><strong></strong><span>Bugünkü rota ilerlemesi</span>';
    }
    const progress = normalizedProgress(root);
    card.querySelector('strong').textContent = progress.label;
    card.style.setProperty('--pnx-progress', progress.pct + '%');
    return card;
  }

  function polishHeading(header) {
    const h1 = header.querySelector('h1');
    if (!h1 || h1.dataset.pnxTitle === '1') return;
    const current = text(h1);
    const match = current.match(/^(.*?)(?:,\s*)?Bugünkü Rotan\.?$/i);
    if (match) {
      const name = (match[1] || '').trim().replace(/,\s*$/, '');
      h1.textContent = (name ? name + ', ' : '') + 'Bugünkü Rotan hazır.';
    }
    h1.dataset.pnxTitle = '1';
  }

  function composeToday(header) {
    const root = header.closest('.content') || header.parentElement;
    if (!root) return;

    document.body.classList.add(BODY_CLASS);
    polishHeading(header);

    const command = root.querySelector('.route-command-grid');
    const rail = command?.querySelector('.premium-signal-rail');
    const hero = command?.querySelector('.route-today-hero') || root.querySelector('.route-today-hero');
    const listHead = root.querySelector('.route-list-head');
    const list = root.querySelector('.route-list');
    const reason = root.querySelector('.route-reason.route-coach-insight') || root.querySelector('.route-coach-insight');
    if (!command || !rail || !hero || !listHead || !list) return;

    const progress = ensureProgressSignal(root, rail);
    const today = signalByLabel(rail, 'BUGÜN');
    const load = signalByLabel(rail, 'KALAN YÜK');
    const mode = signalByLabel(rail, 'ROTA MODU');
    const target = signalByLabel(rail, 'HEDEF SİNYALİ');

    [today, load, progress, mode].filter(Boolean).forEach((card) => rail.appendChild(card));

    if (header.dataset.pnxMounted !== '1') {
      const stage = document.createElement('section');
      stage.className = 'pnx-stage';
      stage.setAttribute('aria-label', 'Bugünün ana çalışma alanı');

      const primary = document.createElement('div');
      primary.className = 'pnx-primary';
      primary.appendChild(hero);

      const routePanel = document.createElement('aside');
      routePanel.className = 'pnx-route-panel';
      routePanel.setAttribute('aria-label', 'Bugünün Rotası');
      routePanel.append(listHead, list);

      stage.append(primary, routePanel);
      command.insertAdjacentElement('afterend', stage);

      const intel = document.createElement('section');
      intel.className = 'pnx-intel-strip';
      intel.setAttribute('aria-label', 'Rota kararının açıklaması');

      if (reason) {
        const kicker = reason.querySelector('.route-reason-kicker');
        const heading = reason.querySelector('strong');
        if (kicker) kicker.textContent = 'ROTA KARARI · AÇIKLANABİLİR';
        if (heading) {
          heading.textContent = 'Neden bugün?';
          if (!reason.querySelector('.pnx-legacy-reason-label')) {
            const legacyLabel = document.createElement('span');
            legacyLabel.className = 'sr-only pnx-legacy-reason-label';
            legacyLabel.textContent = 'Bu plan neden böyle?';
            heading.insertAdjacentElement('afterend', legacyLabel);
          }
        }
        intel.appendChild(reason);
      }

      if (target) {
        target.classList.add('pnx-target-signal');
        intel.appendChild(target);
      }

      if (intel.children.length) stage.insertAdjacentElement('afterend', intel);

      header.dataset.pnxMounted = '1';
    }

    root.querySelectorAll('.route-task').forEach((task) => {
      const done = task.querySelector('.check-btn.done');
      task.classList.toggle('pnx-task-done', !!done);
    });

  }

  function sync() {
    queued = false;
    const shell = document.querySelector('.app-shell');
    const header = document.querySelector('.route-v1-head[data-premium-surface="today"]');
    document.body.classList.toggle(BODY_CLASS, !!shell);
    if (header) composeToday(header);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
})();

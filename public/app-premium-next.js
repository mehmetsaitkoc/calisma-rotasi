/* APP PREMIUM NEXT V2 · approved Today reference composition
   Presentation-only: reuses the real rendered route, tasks and actions. */
(() => {
  const BODY_CLASS = 'app-premium-next-ready';
  const TODAY_CLASS = 'pnx-today-reference';
  let queued = false;

  const text = (node) => (node?.textContent || '').trim();
  const unique = (values) => [...new Set(values.filter(Boolean))];

  function signalByLabel(rail, label) {
    return Array.from(rail?.querySelectorAll(':scope > .premium-signal') || [])
      .find((card) => text(card.querySelector('small')).toLocaleUpperCase('tr-TR') === label);
  }

  function normalizedProgress(root) {
    const label = text(root.querySelector('.route-progress-summary b'));
    const match = label.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return { label: '%0', pct: 0 };
    const pct = Math.max(0, Math.min(100, Number(match[1].replace(',', '.')) || 0));
    return { label: '%' + Math.round(pct), pct };
  }

  function ensureProgressSignal(root, rail) {
    let card = rail.querySelector('.pnx-progress-signal');
    if (!card) {
      card = document.createElement('div');
      card.className = 'premium-signal pnx-progress-signal';
      card.innerHTML = '<small>GÜNLÜK İLERLEME</small><strong></strong><span>günlük ilerleme</span>';
    }
    const progress = normalizedProgress(root);
    card.querySelector('strong').textContent = progress.label;
    card.style.setProperty('--pnx-progress', progress.pct + '%');
    return card;
  }

  function firstName(header) {
    const current = text(header.querySelector('h1'));
    const match = current.match(/^([^,]+),/);
    return (match?.[1] || '').trim() || 'Öğrenci';
  }

  function polishHeading(header) {
    const h1 = header.querySelector('h1');
    if (!h1 || h1.dataset.pnxTitle === '2') return;
    const name = firstName(header);
    h1.innerHTML = '';
    h1.append(document.createTextNode((name ? name + ', ' : '') + 'bugünkü rotan hazır. '));
    const wave = document.createElement('span');
    wave.className = 'pnx-wave';
    wave.setAttribute('aria-hidden', 'true');
    wave.textContent = '👋';
    h1.appendChild(wave);
    h1.dataset.pnxTitle = '2';
  }

  function ensureTopbar(header) {
    const topbar = document.querySelector('.topbar');
    if (!topbar || topbar.dataset.pnxReference === '1') return;

    const search = document.createElement('button');
    search.type = 'button';
    search.className = 'pnx-global-search';
    search.dataset.action = 'nav';
    search.dataset.view = 'topics';
    search.innerHTML = '<span class="pnx-search-icon" aria-hidden="true"></span><span>Ders, konu, soru ara...</span>';

    const profile = document.createElement('div');
    profile.className = 'pnx-profile';
    profile.innerHTML =
      '<span class="pnx-bell" aria-hidden="true"><i></i></span>' +
      '<span class="pnx-profile-avatar">' + (firstName(header).slice(0,2).toLocaleUpperCase('tr-TR') || 'R') + '</span>' +
      '<span class="pnx-profile-copy"><strong>' + firstName(header) + '</strong><small>Öğrenci</small></span>' +
      '<span class="pnx-profile-chevron" aria-hidden="true">⌄</span>';

    topbar.prepend(search);
    topbar.append(profile);
    topbar.dataset.pnxReference = '1';
  }

  function ensureHeaderArt(header) {
    if (header.querySelector('.pnx-head-art')) return;
    const rawDate = text(header.querySelector('.eyebrow'));
    const parts = rawDate.split(/\s+/);
    const day = parts[0] || '';
    const month = parts[1] || '';
    const year = parts[2] || '';
    const weekday = parts.slice(3).join(' ');

    const art = document.createElement('aside');
    art.className = 'pnx-head-art';
    art.setAttribute('aria-label', 'Bugünün motivasyon alanı');
    art.innerHTML =
      '<blockquote>“Küçük adımlar,<br>büyük sonuçlar doğurur.”</blockquote>' +
      '<div class="pnx-date-card"><span class="pnx-date-icon" aria-hidden="true"></span><div><strong>' +
        [day, month, year].filter(Boolean).join(' ') +
      '</strong><small>' + weekday + '</small></div><span class="pnx-date-arrows" aria-hidden="true">‹ &nbsp; ›</span></div>' +
      '<div class="pnx-better-you">Daha iyi bir sen<br>mümkün. ✨</div>';
    header.appendChild(art);
  }

  function decorateSignals(rail, cards) {
    const kinds = [
      [cards.today, 'tasks'],
      [cards.load, 'load'],
      [cards.progress, 'progress'],
      [cards.mode, 'mode']
    ];
    kinds.forEach(([card, kind]) => {
      if (!card) return;
      card.dataset.pnxKind = kind;
      if (!card.querySelector('.pnx-signal-icon')) {
        const icon = document.createElement('span');
        icon.className = 'pnx-signal-icon';
        icon.setAttribute('aria-hidden', 'true');
        if (kind === 'progress') icon.dataset.progressLabel = text(card.querySelector('strong'));
        card.prepend(icon);
      } else if (kind === 'progress') {
        card.querySelector('.pnx-signal-icon').dataset.progressLabel = text(card.querySelector('strong'));
      }
      rail.appendChild(card);
    });
  }

  function taskReason(root, fallback) {
    return text(root.querySelector('.route-task .route-task-reason')) || text(fallback?.querySelector('p')) || '';
  }

  function ensureFocusHero(root, hero, reason) {
    hero.classList.add('pnx-reference-hero');

    const grow = hero.querySelector(':scope > .grow');
    const start = hero.querySelector(':scope > .route-start-big');
    const total = hero.querySelector(':scope > .route-total');
    if (!grow || !start || !total) return;

    if (!grow.querySelector('.pnx-next-task')) {
      const label = document.createElement('div');
      label.className = 'pnx-next-task';
      label.innerHTML = '<span aria-hidden="true">▣</span><strong>Sıradaki görev</strong>';
      grow.prepend(label);
    }

    const meta = text(grow.querySelector('p'));
    const subject = (meta.split('·')[0] || '').trim();
    const now = grow.querySelector('.route-now-label');
    if (now && subject) {
      now.textContent = subject;
      if (!grow.querySelector('.pnx-legacy-now-label')) {
        const legacyNow = document.createElement('span');
        legacyNow.className = 'sr-only pnx-legacy-now-label';
        legacyNow.textContent = 'ŞİMDİ';
        now.insertAdjacentElement('afterend', legacyNow);
      }
    }

    if (!grow.querySelector('.pnx-task-why')) {
      const why = document.createElement('div');
      why.className = 'pnx-task-why';
      why.innerHTML = '<span aria-hidden="true">“</span><p></p>';
      why.querySelector('p').textContent =
        taskReason(root, reason) || 'Bu görev, bugünkü rota önceliğine göre sıraya alındı.';
      grow.appendChild(why);
    }

    if (!hero.querySelector('.pnx-pomodoro')) {
      const minutes = Number(meta.match(/(\d+)\s*dk/i)?.[1] || 40);
      const timer = document.createElement('div');
      timer.className = 'pnx-pomodoro';
      timer.innerHTML =
        '<div class="pnx-pomodoro-ring"><div><strong>' + minutes + ':00</strong>' +
        '<button type="button" class="pnx-pomodoro-play" aria-label="Pomodoro ile başla">▶</button></div></div>' +
        '<span>Pomodoro ile başla</span>';
      const play = timer.querySelector('.pnx-pomodoro-play');
      if (start.dataset.action) play.dataset.action = start.dataset.action;
      if (start.dataset.id) play.dataset.id = start.dataset.id;
      hero.insertBefore(timer, start);
    }

    if (!hero.querySelector('.pnx-focus-quote')) {
      const note = document.createElement('div');
      note.className = 'pnx-focus-quote';
      note.innerHTML = '<span aria-hidden="true">♧</span> Disiplin, hayallerini gerçeğe dönüştürür. ✨';
      hero.appendChild(note);
    }
  }

  function ensureRoutePanel(routePanel, listHead, list) {
    routePanel.classList.add('pnx-reference-route-panel');
    const tasks = Array.from(list.querySelectorAll('.route-task'));
    tasks.forEach((task, index) => {
      task.dataset.pnxIndex = String(index + 1);
      task.style.setProperty('--pnx-index', '"' + (index + 1) + '"');
    });

    const h2 = listHead.querySelector('h2');
    const status = listHead.querySelector('.route-list-status');
    if (h2 && h2.dataset.pnxLabel !== '2') {
      const previous = text(h2);
      h2.dataset.pnxOriginal = previous;
      h2.textContent = 'Bugünün Rotası';
      h2.dataset.pnxLabel = '2';
    }
    if (status) {
      const open = tasks.filter((task) => !task.classList.contains('is-done')).length;
      status.textContent = 'Bugün ' + open + ' görev seni bekliyor.';
    }

    if (!listHead.querySelector('.pnx-route-calendar')) {
      const icon = document.createElement('span');
      icon.className = 'pnx-route-calendar';
      icon.setAttribute('aria-hidden', 'true');
      listHead.prepend(icon);
    }

    if (!listHead.querySelector('.pnx-route-see-all')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pnx-route-see-all';
      button.textContent = 'Tümünü gör →';
      button.addEventListener('click', () => {
        const expanded = routePanel.classList.toggle('pnx-expanded');
        button.textContent = expanded ? 'Daralt ↑' : 'Tümünü gör →';
      });
      listHead.appendChild(button);
    }
  }

  function modeInfo(root) {
    const pill = root.querySelector('.route-task .route-adaptive-pill');
    const explanation = text(root.querySelector('.route-task .route-mode-explain'));
    const classes = Array.from(pill?.classList || []);
    let label = 'DENGE';
    if (classes.includes('mode-repair')) label = 'ONARIM';
    else if (classes.includes('mode-progress')) label = 'İLERLEME';
    else if (classes.includes('mode-ease')) label = 'HAFİF';
    const subtitle = {
      ONARIM: 'Açığı kapat',
      İLERLEME: 'Tempolu ilerleme',
      HAFİF: 'Yükü azalt',
      DENGE: 'Tempolu ilerleme'
    }[label];
    return { label, subtitle, explanation };
  }

  function ensureReasonCard(root, reason) {
    reason.classList.add('pnx-reason-card');
    const kicker = reason.querySelector('.route-reason-kicker');
    const heading = reason.querySelector('strong');
    const paragraph = reason.querySelector('p');

    if (kicker) kicker.textContent = 'ROTA KARARI';
    if (heading) {
      heading.textContent = 'Neden bugün?';
      if (!reason.querySelector('.pnx-legacy-reason-label')) {
        const legacy = document.createElement('span');
        legacy.className = 'sr-only pnx-legacy-reason-label';
        legacy.textContent = 'Bu plan neden böyle?';
        heading.insertAdjacentElement('afterend', legacy);
      }
    }

    const reasonButton = reason.querySelector('.btn');
    const whyButton = root.querySelector('.route-task [data-action="route-why"]');
    if (reasonButton) {
      reasonButton.textContent = 'Bu görev neden öne çıktı?';
      if (whyButton?.dataset?.id) {
        reasonButton.dataset.action = 'route-why';
        reasonButton.dataset.id = whyButton.dataset.id;
        delete reasonButton.dataset.view;
      }
    }

    if (paragraph && !reason.querySelector('.pnx-reason-list')) {
      const candidates = unique([
        ...Array.from(root.querySelectorAll('.route-task .route-task-reason')).slice(0,3).map(text),
        text(paragraph)
      ]).slice(0,3);
      const list = document.createElement('div');
      list.className = 'pnx-reason-list';
      candidates.forEach((item) => {
        const row = document.createElement('div');
        row.innerHTML = '<span aria-hidden="true">✓</span><p></p>';
        row.querySelector('p').textContent = item;
        list.appendChild(row);
      });
      paragraph.classList.add('pnx-original-reason');
      paragraph.insertAdjacentElement('afterend', list);
    }
  }

  function ensureModeCard(root, intel) {
    let card = intel.querySelector('.pnx-mode-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx-mode-card';
      intel.appendChild(card);
    }
    const info = modeInfo(root);
    card.innerHTML =
      '<div class="pnx-bottom-head"><span class="pnx-stack-icon" aria-hidden="true"></span><strong>Rota modu</strong><span>Modu değiştir</span></div>' +
      '<div class="pnx-mode-body"><span class="pnx-mode-bars" aria-hidden="true"><i></i><i></i><i></i></span><div><strong>' +
      info.label + '</strong><span>' + info.subtitle + '</span></div></div>' +
      '<p>' + (info.explanation || 'Bugünkü rota modu; yük, tekrar ve ilerleme sinyallerini birlikte dengeler.') + '</p>';
  }

  function ensureTeacherCard(intel) {
    if (intel.querySelector('.pnx-teacher-card')) return;
    const card = document.createElement('section');
    card.className = 'pnx-teacher-card';
    card.innerHTML =
      '<div class="pnx-teacher-copy"><div class="pnx-bottom-head"><span class="pnx-teacher-spark" aria-hidden="true">✦</span><strong>Rota Hoca</strong><span>→</span></div>' +
      '<p>Bugünkü rotanı ve son eksiklerini biliyorum.</p>' +
      '<div class="pnx-teacher-actions">' +
      '<button type="button" data-action="nav" data-view="teacher">◯ &nbsp; Soru sor</button>' +
      '<button type="button" data-action="nav" data-view="teacher">♧ &nbsp; Daha basit anlat</button>' +
      '</div></div>' +
      '<div class="pnx-teacher-bubble">Nasıl<br>yardımcı olabilirim?</div>' +
      '<img src="/rota-hoca-avatar.jpg" alt="" class="pnx-teacher-avatar" />';
    intel.appendChild(card);
  }

  function composeToday(header) {
    const root = header.closest('.content') || header.parentElement;
    if (!root) return;

    document.body.classList.add(BODY_CLASS, TODAY_CLASS);
    polishHeading(header);
    ensureTopbar(header);
    ensureHeaderArt(header);

    const command = root.querySelector('.route-command-grid');
    const rail = command?.querySelector('.premium-signal-rail');
    const hero = command?.querySelector('.route-today-hero') || root.querySelector('.route-today-hero');
    const listHead = root.querySelector('.route-list-head');
    const list = root.querySelector('.route-list');
    const reason = root.querySelector('.route-reason.route-coach-insight') || root.querySelector('.route-coach-insight');
    if (!command || !rail || !hero || !listHead || !list || !reason) return;

    const progress = ensureProgressSignal(root, rail);
    const today = signalByLabel(rail, 'BUGÜN');
    const load = signalByLabel(rail, 'KALAN YÜK');
    const mode = signalByLabel(rail, 'ROTA MODU');
    const target = signalByLabel(rail, 'HEDEF SİNYALİ');

    if (target) {
      target.classList.add('pnx-hidden-target');
      target.hidden = true;
    }
    decorateSignals(rail, { today, load, progress, mode });

    if (header.dataset.pnxMounted !== '2') {
      const stage = document.createElement('section');
      stage.className = 'pnx-stage pnx-focus-layout';
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
      intel.setAttribute('aria-label', 'Bugünün rota açıklaması');
      intel.appendChild(reason);
      stage.insertAdjacentElement('afterend', intel);

      header.dataset.pnxMounted = '2';
    }

    const stage = root.querySelector('.pnx-stage');
    const routePanel = stage?.querySelector('.pnx-route-panel');
    const intel = root.querySelector('.pnx-intel-strip');
    if (!stage || !routePanel || !intel) return;

    ensureFocusHero(root, hero, reason);
    ensureRoutePanel(routePanel, listHead, list);
    ensureReasonCard(root, reason);
    ensureModeCard(root, intel);
    ensureTeacherCard(intel);

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
    document.body.classList.toggle(TODAY_CLASS, !!header);
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

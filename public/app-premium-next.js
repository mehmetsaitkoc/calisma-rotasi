/* APP PREMIUM NEXT V3 · KPSS TARGET DASHBOARD
   Presentation-only: preserves the real sidebar, route tasks, actions and data evidence. */
(() => {
  const BODY_CLASS = 'app-premium-next-ready';
  const TODAY_CLASS = 'pnx-today-reference';
  const DASH_CLASS = 'pnx3-dashboard-ready';
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
    const value = card.querySelector('strong');
    if (value && text(value) !== progress.label) value.textContent = progress.label;
    card.style.setProperty('--pnx-progress', progress.pct + '%');
    return card;
  }

  function firstName(header) {
    const cached = String(header?.dataset?.pnxStudentName || '').trim();
    if (cached) return cached;

    const current = text(header?.querySelector('h1'));
    const match = current.match(/^([^,]+),/);
    let name = (match?.[1] || '').trim();

    // The V3 title starts with “Bugün,” after the first composition pass.
    // Never let subsequent MutationObserver passes overwrite the real student name.
    if (!name || name.toLocaleLowerCase('tr-TR') === 'bugün') {
      const existing = text(document.querySelector('.pnx-profile-copy strong'));
      if (existing && existing.toLocaleLowerCase('tr-TR') !== 'bugün') name = existing;
    }
    if (!name || name.toLocaleLowerCase('tr-TR') === 'bugün') name = 'Öğrenci';

    if (header) header.dataset.pnxStudentName = name;
    return name;
  }

  function polishHeading(header) {
    const name = firstName(header);
    let greeting = header.querySelector('.pnx3-greeting');
    if (!greeting) {
      greeting = document.createElement('div');
      greeting.className = 'pnx3-greeting';
      header.querySelector(':scope > div')?.prepend(greeting);
    }
    greeting.textContent = 'GÜNAYDIN ' + name.toLocaleUpperCase('tr-TR') + ',';

    const kicker = header.querySelector('.route-today-kicker');
    if (kicker) kicker.style.display = 'none';

    const h1 = header.querySelector('h1');
    if (h1 && h1.dataset.pnxTitle !== '3') {
      h1.textContent = 'Bugün, hedefindeki sen için güçlü bir gün!';
      h1.dataset.pnxTitle = '3';
    }

    const subline = header.querySelector('.route-today-subline');
    if (subline) {
      subline.textContent = 'Disiplin, istikrarlı ilerleme ve doğru plan seni KPSS hedefine ulaştırır.';
    }
  }

  function ensureTopbar(header) {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    let search = topbar.querySelector('.pnx-global-search');
    if (!search) {
      search = document.createElement('button');
      search.type = 'button';
      search.className = 'pnx-global-search';
      search.dataset.action = 'nav';
      search.dataset.view = 'topics';
      search.innerHTML = '<span class="pnx-search-icon" aria-hidden="true"></span><span></span>';
      topbar.prepend(search);
    }
    const searchCopy = search.querySelector('span:last-child');
    if (searchCopy) searchCopy.textContent = 'KPSS\'de ne çalışmak istersin?';

    let profile = topbar.querySelector('.pnx-profile');
    if (!profile) {
      profile = document.createElement('div');
      profile.className = 'pnx-profile';
      topbar.append(profile);
    }
    const name = firstName(header);
    profile.innerHTML =
      '<span class="pnx-profile-avatar">' + (name.slice(0,2).toLocaleUpperCase('tr-TR') || 'R') + '</span>' +
      '<span class="pnx-profile-copy"><strong>' + name + '</strong><small>Öğrenci</small></span>' +
      '<span class="pnx-profile-chevron" aria-hidden="true">⌄</span>';
    topbar.dataset.pnxReference = '3';
  }

  function dateParts(header) {
    const raw = text(header.querySelector('.eyebrow'));
    const parts = raw.split(/\s+/).filter(Boolean);
    return {
      date: parts.slice(0,3).join(' ') || 'Bugün',
      weekday: parts.slice(3).join(' ') || ''
    };
  }

  function ensureHeaderArt(header) {
    let art = header.querySelector('.pnx-head-art');
    if (!art) {
      art = document.createElement('aside');
      art.className = 'pnx-head-art';
      header.appendChild(art);
    }
    const date = dateParts(header);
    art.setAttribute('aria-label', 'Bugünün motivasyon ve tarih alanı');
    art.innerHTML =
      '<div class="pnx3-hand-note">Hedefine<br>biraz daha yakınsın,<br>devam et. 💙</div>' +
      '<div class="pnx-date-card"><span class="pnx-date-icon" aria-hidden="true"></span><div><strong>' +
        date.date +
      '</strong><small>' + date.weekday + '</small></div><span class="pnx-date-arrows" aria-hidden="true">‹ &nbsp; ›</span></div>' +
      '<blockquote>“Planlı çalışan,<br>hedefine ulaşır.”</blockquote>';
  }

  function normalizeSignalCopy(card, kind) {
    if (!card) return;
    const strong = card.querySelector('strong');
    const span = card.querySelector('span:not(.pnx-signal-icon)');
    if (kind === 'tasks' && strong) {
      const match = text(strong).match(/\d+/);
      if (match) strong.textContent = match[0];
      if (span) span.textContent = 'Açık görev';
    } else if (kind === 'load' && span) {
      span.textContent = 'Kalan yük';
    } else if (kind === 'progress' && span) {
      span.textContent = 'Günlük ilerleme';
    } else if (kind === 'mode' && span) {
      span.textContent = 'Rota modu';
    }
  }

  function decorateSignals(rail, cards) {
    const kinds = [
      [cards.today, 'tasks'],
      [cards.load, 'load'],
      [cards.progress, 'progress'],
      [cards.mode, 'mode']
    ].filter(([card]) => !!card);

    kinds.forEach(([card, kind]) => {
      card.dataset.pnxKind = kind;
      let icon = card.querySelector('.pnx-signal-icon');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'pnx-signal-icon';
        icon.setAttribute('aria-hidden', 'true');
        card.prepend(icon);
      }
      if (kind === 'progress') icon.dataset.progressLabel = text(card.querySelector('strong'));
      normalizeSignalCopy(card, kind);
    });

    kinds.forEach(([card], index) => {
      if (rail.children[index] !== card) rail.insertBefore(card, rail.children[index] || null);
    });
  }

  function taskReason(root, fallback) {
    return text(root.querySelector('.route-task .route-task-reason')) || text(fallback?.querySelector('p')) || '';
  }

  function startPreviewTimer(root, hero) {
    const start = hero.querySelector(':scope > .route-start-big[data-action="focus-session"]');
    if (!start) return;
    start.click();

    // focus-session prepares the real application timer and re-renders Today.
    // Start the real timer immediately after that render so the large 40:00
    // card behaves like a timer instead of being a decorative control.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const toggle = document.querySelector('#timer-toggle');
      if (toggle) toggle.click();
    }));
  }

  function ensureFocusHero(root, hero, reason) {
    hero.classList.add('pnx-reference-hero','pnx3-focus-card');

    const grow = hero.querySelector(':scope > .grow');
    const start = hero.querySelector(':scope > .route-start-big');
    const total = hero.querySelector(':scope > .route-total');
    if (!grow || !start || !total) return;

    if (!hero.querySelector('.pnx3-focus-tabs')) {
      const tabs = document.createElement('div');
      tabs.className = 'pnx3-focus-tabs';
      tabs.innerHTML =
        '<button type="button" class="active" data-pnx-timer-mode="pomodoro">Pomodoro</button>' +
        '<button type="button" data-pnx-timer-mode="countdown">Geri Sayım</button>' +
        '<button type="button" data-pnx-timer-mode="free">Serbest</button>';

      const pomodoro = tabs.querySelector('[data-pnx-timer-mode="pomodoro"]');
      const countdown = tabs.querySelector('[data-pnx-timer-mode="countdown"]');
      const free = tabs.querySelector('[data-pnx-timer-mode="free"]');

      pomodoro?.addEventListener('click', () => {
        tabs.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button === pomodoro));
      });
      countdown?.addEventListener('click', () => {
        tabs.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button === countdown));
        startPreviewTimer(root, hero);
      });
      free?.addEventListener('click', () => {
        const addLog = root.querySelector('[data-action="add-log"]');
        if (addLog) addLog.click();
      });
      hero.prepend(tabs);
    }

    if (!hero.querySelector('.pnx-pomodoro')) {
      const meta = text(grow.querySelector('p'));
      const minutes = Math.max(1, Number(meta.match(/(\d+)\s*dk/i)?.[1] || 40));
      const timer = document.createElement('div');
      timer.className = 'pnx-pomodoro pnx3-pomodoro-preview';
      timer.innerHTML =
        '<button type="button" class="pnx-pomodoro-ring" aria-label="' + minutes + ' dakikalık Pomodoro sayacını başlat">' +
          '<span class="pnx3-preview-timer"><strong>' + minutes + ':00</strong>' +
          '<i class="pnx-pomodoro-play" aria-hidden="true">▶</i></span>' +
        '</button>' +
        '<span>Pomodoro ile başla</span>';
      timer.querySelector('.pnx-pomodoro-ring')?.addEventListener('click', () => startPreviewTimer(root, hero));
      hero.insertBefore(timer, start);
    }

    let quote = hero.querySelector('.pnx3-focus-quote');
    if (!quote) {
      quote = document.createElement('p');
      quote.className = 'pnx3-focus-quote';
      hero.appendChild(quote);
    }
    quote.textContent = '“Küçük adımlar, büyük sonuçlar doğurur.”';

    const why = taskReason(root, reason);
    hero.dataset.reason = why || '';
  }

  function mountLiveTimer(root, focus, hero) {
    const live = root.querySelector('.route-focus-card');
    focus.classList.toggle('pnx3-has-live-timer', !!live);
    if (!live) return;

    live.classList.add('pnx3-live-timer-card');
    if (!focus.contains(live)) focus.appendChild(live);
    hero.setAttribute('aria-hidden', 'true');
  }

  function ensureRoutePanel(routePanel, listHead, list) {
    routePanel.classList.add('pnx-reference-route-panel','pnx3-plan-card');
    const tasks = Array.from(list.querySelectorAll('.route-task'));
    tasks.forEach((task, index) => {
      task.dataset.pnxIndex = String(index + 1);
      task.style.setProperty('--pnx-index', '"' + (index + 1) + '"');
    });

    const h2 = listHead.querySelector('h2');
    if (h2) h2.textContent = 'Bugünün Planı';

    const status = listHead.querySelector('.route-list-status');
    if (status) status.textContent = 'Bugün ' + tasks.filter((task) => !task.classList.contains('is-done')).length + ' görev seni bekliyor.';

    if (!listHead.querySelector('.pnx-route-calendar')) {
      const icon = document.createElement('span');
      icon.className = 'pnx-route-calendar';
      icon.setAttribute('aria-hidden', 'true');
      listHead.prepend(icon);
    }

    let seeAll = listHead.querySelector('.pnx-route-see-all');
    if (!seeAll) {
      seeAll = document.createElement('button');
      seeAll.type = 'button';
      seeAll.className = 'pnx-route-see-all';
      listHead.appendChild(seeAll);
    }
    seeAll.textContent = 'Tümünü gör →';
    seeAll.onclick = () => {
      const expanded = routePanel.classList.toggle('pnx-expanded');
      seeAll.textContent = expanded ? 'Daralt ↑' : 'Tümünü gör →';
    };
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
    if (kicker) kicker.textContent = 'ROTA KARARI';
    if (heading) heading.textContent = 'Neden bugün?';

    const paragraph = reason.querySelector('p');
    if (paragraph && !reason.querySelector('.pnx-reason-list')) {
      const candidates = unique([
        ...Array.from(root.querySelectorAll('.route-task .route-task-reason')).slice(0,4).map(text),
        text(paragraph)
      ]).slice(0,4);
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

  function ensureModeCard(root, host) {
    let card = host.querySelector('.pnx-mode-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx-mode-card';
      host.appendChild(card);
    }
    const info = modeInfo(root);
    card.innerHTML =
      '<div class="pnx-bottom-head"><span class="pnx-stack-icon" aria-hidden="true"></span><strong>Rota modu</strong><span>Modu değiştir</span></div>' +
      '<div class="pnx-mode-body"><span class="pnx-mode-bars" aria-hidden="true"><i></i><i></i><i></i></span><div><strong>' +
      info.label + '</strong><span>' + info.subtitle + '</span></div></div>' +
      '<p>' + (info.explanation || 'Bugünkü rota modu; yük, tekrar ve ilerleme sinyallerini birlikte dengeler.') + '</p>';
    return card;
  }

  function ensureWeekCard(host, root) {
    let card = host.querySelector('.pnx3-week-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-side-card pnx3-week-card';
      host.appendChild(card);
    }
    const progress = normalizedProgress(root).pct;
    const labels = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
    const day = new Date().getDay();
    const mondayIndex = day === 0 ? 6 : day - 1;
    const bars = labels.map((label,index) => {
      const active = index === mondayIndex;
      const height = active ? Math.max(18, Math.round(progress * .62)) : 16;
      return '<span class="' + (active ? 'active' : '') + '"><i style="height:' + height + '%"></i><b>' + label + '</b></span>';
    }).join('');
    card.innerHTML =
      '<header><strong>Bu Hafta</strong><span>Detay →</span></header>' +
      '<div class="pnx3-week-bars">' + bars + '</div>' +
      '<footer><span>Bugünkü ilerleme</span><strong>%' + progress + '</strong></footer>' +
      '<div class="pnx3-week-progress"><i style="width:' + progress + '%"></i></div>';
  }

  function ensureGoalsCard(host, targetSignal) {
    let card = host.querySelector('.pnx3-goals-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-side-card pnx3-goals-card';
      host.appendChild(card);
    }
    const gap = text(targetSignal?.querySelector('strong')) || 'Veri bekleniyor';
    const detail = text(targetSignal?.querySelector('span')) || 'İlk denemeyle netleşecek';
    card.innerHTML =
      '<header><strong>Hedeflerim</strong><span>Düzenle →</span></header>' +
      '<div class="pnx3-goal-row"><span class="g green"></span><div><b>KPSS Genel Net</b><small>' + gap + '</small></div><em>' + detail + '</em></div>' +
      '<div class="pnx3-goal-row"><span class="g blue"></span><div><b>Tarih Netim</b><small>Performans verisi birikiyor</small></div><em>—</em></div>' +
      '<div class="pnx3-goal-row"><span class="g orange"></span><div><b>Vatandaşlık Netim</b><small>Performans verisi birikiyor</small></div><em>—</em></div>';
  }

  function ensureQuoteCard(host) {
    let card = host.querySelector('.pnx3-quote-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-quote-card';
      host.appendChild(card);
    }
    card.innerHTML =
      '<span>✧ &nbsp; Günün Sözü</span>' +
      '<strong>“Zorluklar, seni daha güçlü bir sen haline getirir.”</strong>';
  }

  function ensureTeacherCard(host) {
    let card = host.querySelector('.pnx-teacher-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx-teacher-card pnx3-teacher-card';
      host.appendChild(card);
    }
    card.innerHTML =
      '<div class="pnx3-teacher-main">' +
        '<header><strong>Rota Hoca</strong><span>● &nbsp; Çevrimiçi</span></header>' +
        '<p>KPSS yolculuğunda yanındayım.<br>Merak ettiğin her şeyi sor, birlikte ilerleyelim.</p>' +
        '<button type="button" class="pnx3-teacher-input" data-action="nav" data-view="teacher">Örneğin: Anayasa’da temel haklar... <b>→</b></button>' +
        '<div class="pnx3-teacher-tools">' +
          '<button type="button" data-action="nav" data-view="teacher">▣ &nbsp; Fotoğraf</button>' +
          '<button type="button" data-action="nav" data-view="teacher">♩ &nbsp; Mikrofon</button>' +
          '<button type="button" data-action="nav" data-view="teacher">▤ &nbsp; Dosya Yükle</button>' +
        '</div>' +
      '</div>' +
      '<div class="pnx3-teacher-bubble">Sen sor,<br>birlikte çözelim!</div>' +
      '<img src="/rota-hoca-avatar-v2.svg" alt="" class="pnx-teacher-avatar" />';
  }

  function ensureResultsCard(host, targetSignal) {
    let card = host.querySelector('.pnx3-results-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-results-card';
      host.appendChild(card);
    }
    const gap = text(targetSignal?.querySelector('strong'));
    const hasSignal = !!gap && !/veri/i.test(gap);
    card.innerHTML =
      '<header><strong>Son Deneme Sonuçlarım</strong><button type="button" data-action="nav" data-view="exams">Detaylı Analiz →</button></header>' +
      '<div class="pnx3-result-rings">' +
        '<div class="pnx3-result-ring"><span>' + (hasSignal ? gap.replace(/\s*fark/i,'') : '—') + '</span><small>Hedef farkı</small></div>' +
        '<div class="pnx3-result-ring coral"><span>' + (hasSignal ? 'Aktif' : '—') + '</span><small>Başarı sinyali</small></div>' +
      '</div>' +
      '<p>' + (hasSignal ? 'Son deneme verin hedef mesafesini güncelledi.' : 'İlk denemeni eklediğinde sonuçların burada görünecek.') + '</p>';
  }

  function ensureInsightArchive(root, reason) {
    let archive = root.querySelector('.pnx3-insight-archive');
    if (!archive) {
      archive = document.createElement('details');
      archive.className = 'pnx3-insight-archive';
      archive.innerHTML = '<summary>Rota kararını neden böyle verdi?</summary><div class="pnx-intel-strip"></div>';
    }
    const host = archive.querySelector('.pnx-intel-strip');
    if (!host.contains(reason)) host.appendChild(reason);
    ensureReasonCard(root, reason);
    ensureModeCard(root, host);
    return archive;
  }

  function ensureFooter(root) {
    let footer = root.querySelector('.pnx3-footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'pnx3-footer';
      footer.innerHTML = '<span>ÇALIŞMA ROTASI &nbsp; | &nbsp; HERKESİN ÇALIŞMA PROGRAMI AYNI OLMAK ZORUNDA DEĞİL.</span><b>Daha iyi bir sen, mümkün. ♥</b>';
      root.appendChild(footer);
    }
  }

  function composeToday(header) {
    const root = header.closest('.content') || header.parentElement;
    if (!root) return;

    document.body.classList.add(BODY_CLASS, TODAY_CLASS, DASH_CLASS);
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
    decorateSignals(rail, { today, load, progress, mode });
    if (target) target.hidden = true;

    let dashboard = root.querySelector('.pnx3-dashboard');
    if (!dashboard) {
      dashboard = document.createElement('section');
      dashboard.className = 'pnx-stage pnx3-dashboard';

      const plan = document.createElement('section');
      plan.className = 'pnx-route-panel pnx3-plan';
      plan.append(listHead, list);

      const focus = document.createElement('section');
      focus.className = 'pnx-primary pnx3-focus';
      focus.appendChild(hero);

      const side = document.createElement('aside');
      side.className = 'pnx3-side-stack';

      dashboard.append(plan, focus, side);
      command.insertAdjacentElement('afterend', dashboard);

      const lower = document.createElement('section');
      lower.className = 'pnx3-lower';
      dashboard.insertAdjacentElement('afterend', lower);
    }

    const plan = dashboard.querySelector('.pnx3-plan');
    const focus = dashboard.querySelector('.pnx3-focus');
    const side = dashboard.querySelector('.pnx3-side-stack');
    const lower = root.querySelector('.pnx3-lower');
    if (!plan || !focus || !side || !lower) return;

    if (!plan.contains(listHead)) plan.append(listHead, list);
    if (!focus.contains(hero)) focus.appendChild(hero);

    ensureRoutePanel(plan, listHead, list);
    ensureFocusHero(root, hero, reason);
    mountLiveTimer(root, focus, hero);
    ensureWeekCard(side, root);
    ensureGoalsCard(side, target);
    ensureTeacherCard(lower);
    ensureResultsCard(lower, target);
    ensureQuoteCard(lower);

    const archive = ensureInsightArchive(root, reason);
    if (!archive.isConnected) lower.insertAdjacentElement('afterend', archive);
    ensureFooter(root);

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
    document.body.classList.toggle(DASH_CLASS, !!header);
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
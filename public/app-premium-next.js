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

    // focus-session prepares the existing real timer and re-renders Today.
    // The dashboard MutationObserver can replace the timer DOM more than once,
    // so resolve the real toggle from document and retry across animation frames.
    // This is only a handoff: duration, endAt, pause/resume, reset and logging
    // remain owned by the application's timer() infrastructure.
    let attempt = 0;
    const startRealTimerWhenReady = () => {
      const toggle = document.querySelector('#timer-toggle');
      if (toggle) {
        const label = text(toggle).toLocaleLowerCase('tr-TR');
        if (label.includes('duraklat')) return;
        toggle.click();
        if (text(document.querySelector('#timer-toggle')).toLocaleLowerCase('tr-TR').includes('duraklat')) return;
      }
      attempt += 1;
      if (attempt < 24) requestAnimationFrame(startRealTimerWhenReady);
    };
    requestAnimationFrame(startRealTimerWhenReady);
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

  function kpssWorkspace() {
    try {
      const space = typeof window.w === 'function' ? window.w() : null;
      return space?.exam === 'kpss' ? space : null;
    } catch {}
    return null;
  }

  function localDay(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function currentWeekDays() {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setHours(12, 0, 0, 0);
    monday.setDate(now.getDate() - offset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return localDay(date);
    });
  }

  function formatMinutes(minutes) {
    const value = Math.max(0, Math.round(Number(minutes) || 0));
    if (value < 60) return value + ' dk';
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest ? hours + ' sa ' + rest + ' dk' : hours + ' sa';
  }

  function latestExam(space) {
    return [...(space?.exams || [])]
      .filter((exam) => exam && Array.isArray(exam.parts))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || Number(a.created || 0) - Number(b.created || 0))
      .at(-1) || null;
  }

  function examStats(exam) {
    if (!exam) return null;
    const analytics = window.RotaReportAnalytics;
    if (analytics?.calcNet) {
      const result = analytics.calcNet(exam);
      if (result && Number.isFinite(Number(result.net))) return result;
    }
    const penalty = Number(exam.penalty) || 0;
    let correct = 0;
    let wrong = 0;
    let total = 0;
    (exam.parts || []).forEach((part) => {
      correct += Number(part?.correct) || 0;
      wrong += Number(part?.wrong) || 0;
      total += Number(part?.total) || 0;
    });
    return { correct, wrong, total, net: correct - (penalty > 0 ? wrong / penalty : 0) };
  }

  function partNet(exam, pattern) {
    const part = (exam?.parts || []).find((item) => pattern.test(String(item?.label || '')));
    if (!part) return null;
    const correct = Number(part.correct) || 0;
    const wrong = Number(part.wrong) || 0;
    const penalty = Number(exam.penalty) || 0;
    return correct - (penalty > 0 ? wrong / penalty : 0);
  }

  function formatNet(value) {
    if (!Number.isFinite(Number(value))) return '—';
    const number = Number(value);
    return (Math.round(number * 10) / 10).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' net';
  }

  function examDateLabel(exam) {
    if (!exam?.date) return 'Son deneme';
    const date = new Date(exam.date + 'T12:00:00');
    return Number.isNaN(date.getTime())
      ? 'Son deneme'
      : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }

  function ensureWeekCard(host, root) {
    let card = host.querySelector('.pnx3-week-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-side-card pnx3-week-card';
      host.appendChild(card);
    }

    const space = kpssWorkspace();
    const days = currentWeekDays();
    const logs = Array.isArray(space?.logs) ? space.logs : [];
    const totals = days.map((date) => logs
      .filter((log) => log?.date === date)
      .reduce((sum, log) => sum + Math.max(0, Number(log?.minutes) || 0), 0));
    const total = totals.reduce((sum, minutes) => sum + minutes, 0);
    const max = Math.max(1, ...totals);
    const todayKey = localDay(new Date());
    const labels = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
    const bars = labels.map((label, index) => {
      const minutes = totals[index];
      const active = days[index] === todayKey;
      const height = minutes > 0 ? Math.max(8, Math.round(minutes / max * 100)) : 0;
      const title = label + ': ' + formatMinutes(minutes);
      return '<span class="' + (active ? 'active' : '') + '" title="' + title + '"><i style="height:' + height + '%;min-height:0"></i><b>' + label + '</b></span>';
    }).join('');

    card.innerHTML =
      '<header><strong>Bu Hafta</strong><span>' + (total ? formatMinutes(total) : 'Kayıt yok') + '</span></header>' +
      '<div class="pnx3-week-bars">' + bars + '</div>' +
      '<footer><span>Kaydedilmiş çalışma</span><strong>' + formatMinutes(total) + '</strong></footer>' +
      '<div class="pnx3-week-progress"><i style="width:' + (total ? Math.round(totals.filter(Boolean).length / 7 * 100) : 0) + '%"></i></div>';
  }

  function ensureGoalsCard(host) {
    let card = host.querySelector('.pnx3-goals-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-side-card pnx3-goals-card';
      host.appendChild(card);
    }

    const exam = latestExam(kpssWorkspace());
    const stats = examStats(exam);
    const history = partNet(exam, /tarih/i);
    const civics = partNet(exam, /vatandaşlık|temel hukuk/i);
    const source = exam ? examDateLabel(exam) + ' denemesi' : 'Deneme verisi birikiyor';

    card.innerHTML =
      '<header><strong>Hedeflerim</strong><span>Gerçek deneme verisi</span></header>' +
      '<div class="pnx3-goal-row"><span class="g green"></span><div><b>KPSS Genel Net</b><small>' + source + '</small></div><em>' + formatNet(stats?.net) + '</em></div>' +
      '<div class="pnx3-goal-row"><span class="g blue"></span><div><b>Tarih Netim</b><small>' + (history === null ? 'Veri birikiyor' : source) + '</small></div><em>' + formatNet(history) + '</em></div>' +
      '<div class="pnx3-goal-row"><span class="g orange"></span><div><b>Vatandaşlık Netim</b><small>' + (civics === null ? 'Veri birikiyor' : source) + '</small></div><em>' + formatNet(civics) + '</em></div>';
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

  function ensureResultsCard(host) {
    let card = host.querySelector('.pnx3-results-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'pnx3-results-card';
      host.appendChild(card);
    }

    const exam = latestExam(kpssWorkspace());
    const stats = examStats(exam);
    card.classList.toggle('is-empty', !exam || !stats);

    if (!exam || !stats) {
      card.innerHTML =
        '<header><strong>Son Deneme Sonuçlarım</strong><button type="button" data-action="nav" data-view="exams">Deneme Merkezi →</button></header>' +
        '<div class="pnx3-results-empty"><strong>Henüz tam deneme kaydı yok</strong><span>İlk denemeni eklediğinde gerçek sonuçların burada görünecek.</span></div>';
      return;
    }

    const netPct = stats.total > 0 ? Math.max(0, Math.min(100, stats.net / stats.total * 100)) : 0;
    const correctPct = stats.total > 0 ? Math.max(0, Math.min(100, stats.correct / stats.total * 100)) : 0;
    const type = String(exam.type || 'KPSS');
    const label = examDateLabel(exam);

    card.innerHTML =
      '<header><strong>Son Deneme Sonuçlarım</strong><button type="button" data-action="nav" data-view="exams">Detaylı Analiz →</button></header>' +
      '<div class="pnx3-result-rings">' +
        '<div class="pnx3-result-ring" style="--pnx-ring-pct:' + netPct + '%"><span>' + formatNet(stats.net).replace(' net','') + '</span><small>Genel net</small></div>' +
        '<div class="pnx3-result-ring coral" style="--pnx-ring-pct:' + correctPct + '%"><span>' + Math.round(stats.correct) + '</span><small>Doğru</small></div>' +
      '</div>' +
      '<p>' + type + ' · ' + label + ' · ' + Math.round(stats.total) + ' soru üzerinden gerçek deneme kaydı.</p>';
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
    ensureGoalsCard(side);
    ensureTeacherCard(lower);
    ensureResultsCard(lower);
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


/* Load the latest main Programım timeline styles without disturbing the Today dashboard layer. */
(() => {
  [
    '/dashboard-evidence.css',
    '/program-daily-timeline-core.css',
    '/program-daily-timeline-rail.css'
  ].forEach((href) => {
    if (document.querySelector('link[href="' + href + '"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.pnxProgramTimeline = '1';
    document.head.appendChild(link);
  });
})();

/* APP PREMIUM NEXT V4 · PROGRAM DAILY TIMELINE
   Presentation-only enhancement for Programım. It keeps the real route cards and actions,
   but turns the weekly wall into a focused selected-day workspace. */
(() => {
  const BODY_CLASS = 'pnx-program-day-ready';
  let queued = false;
  let selectedIndex = null;

  const text = (node) => (node?.textContent || '').trim();
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function programRoot() {
    const root = document.querySelector('.content');
    if (!root) return null;
    const title = root.querySelector('.page-head h1');
    const grid = root.querySelector('.week-grid');
    if (!grid || text(title) !== 'Programım') return null;
    return root;
  }

  function dayColumns(root) {
    return Array.from(root.querySelectorAll('.week-grid > .day-column'));
  }

  function dayMeta(column, index) {
    const weekday = text(column.querySelector('.day-title span')) || 'Gün';
    const day = text(column.querySelector('.day-title strong')) || String(index + 1);
    const cards = Array.from(column.querySelectorAll('.route-plan-card'));
    const done = cards.filter((card) => card.classList.contains('done')).length;
    const loadText = text(column.querySelector('.route-day-load'));
    const loadMatch = loadText.match(/Açık görev yükü:\s*(.*?)\s*\/\s*(.*)$/i);
    const remaining = loadMatch?.[1] || '—';
    const capacity = loadMatch?.[2] || '—';
    const summary = text(column.querySelector('.route-day-summary strong')) || (cards.length ? cards.length + ' görev' : 'Boş gün');
    return {
      index,
      weekday,
      day,
      cards,
      done,
      total: cards.length,
      remaining,
      capacity,
      summary,
      today: column.classList.contains('today')
    };
  }

  function defaultIndex(columns) {
    if (!columns.length) return 0;
    const todayIndex = columns.findIndex((column) => column.classList.contains('today'));
    if (todayIndex >= 0) return todayIndex;
    const firstLoaded = columns.findIndex((column) => column.querySelector('.route-plan-card'));
    return firstLoaded >= 0 ? firstLoaded : 0;
  }

  function ensureCardStart(card, step) {
    card.dataset.pnxStep = String(step + 1);
    if (card.classList.contains('done')) return;

    const id =
      card.querySelector('[data-action="route-why"]')?.dataset.id ||
      card.querySelector('[data-action="route-skip"]')?.dataset.id ||
      card.querySelector('[data-id]')?.dataset.id ||
      '';
    if (!id || card.querySelector('.pnx-program-start')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn primary pnx-program-start';
    button.dataset.action = 'focus-session';
    button.dataset.id = id;
    button.innerHTML = '<span aria-hidden="true">▶</span><span>Çalışmaya başla</span>';

    const actionRow = card.querySelector('.row.between.mt');
    const actionGroup = actionRow?.querySelector(':scope > .row');
    if (actionGroup) {
      actionGroup.prepend(button);
    } else if (actionRow) {
      actionRow.appendChild(button);
    } else {
      card.appendChild(button);
    }
  }

  function ensureStrip(root, metas) {
    let strip = root.querySelector('.pnx-program-week-strip');
    if (!strip) {
      strip = document.createElement('section');
      strip.className = 'pnx-program-week-strip';
      root.querySelector('.page-head')?.insertAdjacentElement('afterend', strip);
    }

    const weekToolbar = root.querySelector('.route-week-summary')?.nextElementSibling;
    if (weekToolbar?.classList.contains('toolbar')) weekToolbar.classList.add('pnx-program-legacy-toolbar');

    const signature = metas.map((meta) => [meta.weekday, meta.day, meta.total, meta.done, meta.today].join(':')).join('|');
    if (strip.dataset.signature === signature) return strip;
    strip.dataset.signature = signature;
    strip.innerHTML =
      '<button type="button" class="pnx-week-arrow" data-action="week-prev" aria-label="Önceki hafta">‹</button>' +
      '<div class="pnx-program-days" role="tablist" aria-label="Haftanın günleri">' +
      metas.map((meta) =>
        '<button type="button" class="pnx-program-day-tab" data-pnx-program-day="' + meta.index + '" role="tab">' +
          '<small>' + esc(meta.weekday.slice(0,3)) + '</small>' +
          '<strong>' + esc(meta.day) + '</strong>' +
          '<span>' + (meta.total ? meta.total + ' görev' : 'Boş gün') + '</span>' +
        '</button>'
      ).join('') +
      '</div>' +
      '<button type="button" class="pnx-week-arrow" data-action="week-next" aria-label="Sonraki hafta">›</button>' +
      '<button type="button" class="pnx-week-today" data-action="week-today">Bugüne dön</button>';
    return strip;
  }

  function ensureWorkspace(root) {
    let workspace = root.querySelector('.pnx-program-workspace');
    const weekWrap = root.querySelector('.week-wrap');
    if (!weekWrap) return null;

    if (!workspace) {
      workspace = document.createElement('section');
      workspace.className = 'pnx-program-workspace';

      const main = document.createElement('main');
      main.className = 'pnx-program-main';

      const dayHead = document.createElement('header');
      dayHead.className = 'pnx-program-day-head';
      main.appendChild(dayHead);
      main.appendChild(weekWrap);

      const aside = document.createElement('aside');
      aside.className = 'pnx-program-aside';

      workspace.append(main, aside);
      root.appendChild(workspace);
    } else {
      const main = workspace.querySelector('.pnx-program-main');
      if (main && !main.contains(weekWrap)) main.appendChild(weekWrap);
    }
    return workspace;
  }

  function updateDayHead(workspace, meta) {
    const head = workspace.querySelector('.pnx-program-day-head');
    if (!head) return;
    const signature = [meta.weekday, meta.day, meta.summary, meta.remaining].join('|');
    if (head.dataset.signature === signature) return;
    head.dataset.signature = signature;
    head.innerHTML =
      '<div>' +
        '<div class="pnx-program-day-kicker">' + (meta.today ? 'BUGÜNÜN PLANI' : 'SEÇİLİ GÜN') + '</div>' +
        '<h2>' + esc(meta.day + ' ' + meta.weekday) + '</h2>' +
        '<p>' + (meta.total ? 'Rotandaki görevleri sırayla tamamla; tek odağın bir sonraki adım olsun.' : 'Bu gün için planlı görev bulunmuyor.') + '</p>' +
      '</div>' +
      '<div class="pnx-program-day-head-meta">' +
        '<span><b>' + meta.total + '</b> görev</span>' +
        '<span><b>' + esc(meta.remaining) + '</b> kalan</span>' +
      '</div>';
  }

  function weeklyBars(metas) {
    return metas.map((meta) => {
      const pct = meta.total ? Math.round((meta.done / meta.total) * 100) : 0;
      const height = meta.total ? Math.max(18, 22 + pct * 0.42) : 12;
      return '<div class="pnx-week-progress-day">' +
        '<i style="--pnx-bar-h:' + height + 'px;--pnx-bar-pct:' + pct + '%"></i>' +
        '<small>' + esc(meta.weekday.slice(0,3)) + '</small>' +
      '</div>';
    }).join('');
  }

  function activityCells(metas) {
    return metas.map((meta) => {
      const pct = meta.total ? Math.round((meta.done / meta.total) * 100) : 0;
      const level = pct >= 75 ? 4 : pct >= 50 ? 3 : pct >= 25 ? 2 : meta.total ? 1 : 0;
      return '<div class="pnx-activity-cell level-' + level + '">' +
        '<span>' + esc(meta.weekday.slice(0,3)) + '</span>' +
        '<b>' + (meta.total ? meta.done + '/' + meta.total : '—') + '</b>' +
      '</div>';
    }).join('');
  }

  function updateAside(root, workspace, active, metas) {
    const aside = workspace.querySelector('.pnx-program-aside');
    if (!aside) return;

    const weeklyTotal = metas.reduce((sum, meta) => sum + meta.total, 0);
    const weeklyDone = metas.reduce((sum, meta) => sum + meta.done, 0);
    const weeklyPct = weeklyTotal ? Math.round((weeklyDone / weeklyTotal) * 100) : 0;
    const dayPct = active.total ? Math.round((active.done / active.total) * 100) : 0;
    const repeatCount = metas.reduce((sum, meta) =>
      sum + meta.cards.filter((card) => /tekrar/i.test(text(card))).length, 0
    );
    const insight = text(root.querySelector('.route-week-summary .notice')) || 'Rota, çalışma kapasiteni ve mevcut ilerlemeni birlikte değerlendirir.';

    const signature = [active.index, active.total, active.done, active.remaining, weeklyTotal, weeklyDone, repeatCount, insight].join('|');
    if (aside.dataset.signature === signature) return;
    aside.dataset.signature = signature;

    aside.innerHTML =
      '<section class="pnx-program-side-card pnx-program-progress-card">' +
        '<header><span class="pnx-side-icon">◎</span><strong>Günlük ilerleme</strong></header>' +
        '<div class="pnx-day-progress-wrap">' +
          '<div class="pnx-day-progress-ring" style="--pnx-day-progress:' + dayPct + '%"><b>%' + dayPct + '</b><small>Tamamlandı</small></div>' +
          '<div><strong>' + active.done + ' / ' + active.total + ' görev</strong><span>' + esc(active.remaining) + ' açık yük</span></div>' +
        '</div>' +
      '</section>' +

      '<section class="pnx-program-side-card">' +
        '<header><span class="pnx-side-icon">◷</span><strong>Kalan süre</strong></header>' +
        '<div class="pnx-program-time"><b>' + esc(active.remaining) + '</b><span>Bugünkü açık görev yükü</span></div>' +
        '<div class="pnx-thin-progress"><i style="width:' + Math.max(4, 100 - dayPct) + '%"></i></div>' +
      '</section>' +

      '<section class="pnx-program-side-card">' +
        '<header><span class="pnx-side-icon">▥</span><strong>Haftalık ilerleme</strong><em>%' + weeklyPct + '</em></header>' +
        '<div class="pnx-week-progress">' + weeklyBars(metas) + '</div>' +
        '<p>' + weeklyDone + ' / ' + weeklyTotal + ' görev tamamlandı' + (repeatCount ? ' · ' + repeatCount + ' tekrar görevi' : '') + '</p>' +
      '</section>' +

      '<section class="pnx-program-side-card pnx-program-insight">' +
        '<header><span class="pnx-side-icon">✦</span><strong>Rota içgörüsü</strong></header>' +
        '<p>' + esc(insight) + '</p>' +
      '</section>' +

      '<section class="pnx-program-side-card">' +
        '<header><span class="pnx-side-icon">▦</span><strong>Bu hafta aktivite</strong></header>' +
        '<div class="pnx-activity-row">' + activityCells(metas) + '</div>' +
      '</section>';
  }

  function activate(root, workspace, metas, index) {
    const safeIndex = Math.max(0, Math.min(metas.length - 1, index));
    selectedIndex = safeIndex;
    const active = metas[safeIndex];
    const columns = dayColumns(root);

    columns.forEach((column, idx) => {
      const isActive = idx === safeIndex;
      column.classList.toggle('pnx-program-active-day', isActive);
      column.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      if (isActive) {
        Array.from(column.querySelectorAll('.route-plan-card')).forEach(ensureCardStart);
      }
    });

    root.querySelectorAll('.pnx-program-day-tab').forEach((button, idx) => {
      const isActive = idx === safeIndex;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    updateDayHead(workspace, active);
    updateAside(root, workspace, active, metas);
  }

  function sync() {
    queued = false;
    const root = programRoot();
    document.body.classList.toggle(BODY_CLASS, !!root);
    if (!root) return;

    const columns = dayColumns(root);
    if (!columns.length) return;
    const metas = columns.map(dayMeta);
    if (selectedIndex === null || selectedIndex >= metas.length) selectedIndex = defaultIndex(columns);

    ensureStrip(root, metas);
    const workspace = ensureWorkspace(root);
    if (!workspace) return;
    activate(root, workspace, metas, selectedIndex);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="week-today"]')) {
      selectedIndex = null;
      return;
    }
    const button = event.target.closest('[data-pnx-program-day]');
    if (!button) return;
    const nextIndex = Number(button.dataset.pnxProgramDay);
    if (!Number.isInteger(nextIndex)) return;
    selectedIndex = nextIndex;
    schedule();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once:true });
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList:true,
    subtree:true
  });
})();


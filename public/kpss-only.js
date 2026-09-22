/* KPSS-ONLY PRODUCT BOUNDARY
   Keeps the legacy YKS workspace readable for backup compatibility, but never exposes it
   as a selectable product surface. Route Engine, question banks and Student Intelligence
   remain owned by their existing modules. */
(() => {
  const LEGACY_EXAM = 'yks';
  const PRIMARY_EXAM = 'kpss';
  const STATE_PREFIX = 'calisma-rotasi:all:v5';
  let queued = false;
  let redirecting = false;
  let legacyMigrating = false;

  function appStateEntry() {
    try {
      const params = new URLSearchParams(location.search);
      const preferredKey = params.get('fresh') === '1' ? STATE_PREFIX + ':fresh-preview' : STATE_PREFIX;
      const preferredRaw = localStorage.getItem(preferredKey);
      if (preferredRaw) {
        const preferredValue = JSON.parse(preferredRaw);
        if (preferredValue?.workspaces?.kpss && preferredValue?.workspaces?.yks) {
          return { key: preferredKey, value: preferredValue };
        }
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(STATE_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const value = JSON.parse(raw);
        if (value?.workspaces?.kpss && value?.workspaces?.yks) return { key, value };
      }
    } catch {}
    return null;
  }

  function startKpss() {
    if (redirecting) return;
    redirecting = true;
    try {
      let card = document.querySelector('[data-action="choose-exam"][data-exam="kpss"]');
      if (!card) {
        const select = document.querySelector('[data-action="select"]');
        if (select) select.click();
        card = document.querySelector('[data-action="choose-exam"][data-exam="kpss"]');
      }
      if (card) card.click();
    } finally {
      redirecting = false;
    }
  }

  function protectLegacyActiveExam() {
    const entry = appStateEntry();
    if (legacyMigrating || entry?.value?.activeExam !== LEGACY_EXAM) return;

    // An unconfigured KPSS workspace must enter the existing onboarding flow rather than
    // resuming a stale legacy shell. A configured KPSS workspace can safely resume in place.
    if (!entry.value.workspaces?.kpss?.configured) {
      startKpss();
      return;
    }

    legacyMigrating = true;
    try {
      // Change only the selected workspace. Keep legacy YKS data intact for backup compatibility.
      // Reload so the application rehydrates from the migrated persisted state instead of
      // overwriting it from a stale in-memory YKS workspace. The one-shot session marker
      // prevents fresh-preview startup from clearing that state if the reload drops resume=1.
      entry.value.activeExam = PRIMARY_EXAM;
      localStorage.setItem(entry.key, JSON.stringify(entry.value));
      try { sessionStorage.setItem('calisma-rotasi:kpss-legacy-resume:v1', '1'); } catch {}
      location.reload();
    } catch {
      legacyMigrating = false;
      startKpss();
    }
  }

  const copyReplacements = [
    ['KPSS + YKS birlikte', 'KPSS odaklı çalışma alanı'],
    ['KPSS + YKS', 'KPSS'],
    ['KPSS/YKS', 'KPSS'],
    ['Bir paket, iki rota.', 'Tek paket, tek KPSS rotası.'],
    ['KPSS ve YKS kayıtları ayrı tutulur; hesabın bağlandığında tek üyelik erişimi iki çalışma alanında geçerli olacak.', 'KPSS kayıtların bu çalışma alanında tutulur; hesabın bağlandığında üyelik erişimin aynı rotada devam eder.'],
    ['İki sınav için tek paket', 'KPSS için tek paket'],
    ['KPSS ve YKS alanlarında birlikte kullanılır', 'KPSS çalışma alanında kullanılır'],
    ['KPSS ve YKS verilerin', 'KPSS verilerin'],
    ['KPSS Lisans GY–GK ile YKS çalışma takibi bir arada.', 'KPSS Lisans GY–GK çalışma takibi.'],
    ['KPSS, TYT, AYT ve YDT netleri birbirine çevrilmez. Soru yapısı veya yanlış götürme kuralı değişen kayıtlar doğrudan kıyaslanmaz.', 'KPSS denemeleri yalnız aynı kapsam ve kurallardaki kayıtlarla karşılaştırılır.'],
    ['KPSS + TYT + AYT + YDT', 'KPSS'],
    ['Sınav seçimine dön', 'Ana sayfaya dön'],
    ['Sınav değiştir', 'Ana sayfa'],
    ['İKİ HEDEF, TEK ÇALIŞMA ALANI', 'TEK HEDEF, AKILLI ÇALIŞMA ALANI'],
    ['İki sınavın yedeğini yükle?', 'Çalışma yedeğini yükle?'],
    ['Bu işlem KPSS ve YKS alanlarının tüm mevcut kayıtlarını yedekle değiştirir.', 'Bu işlem mevcut yerel çalışma kayıtlarını yedekle değiştirir.'],
    ['Kütüphanede başka alana bakman, haftalık çalışma planındaki YKS alanını değiştirmez.', 'Kütüphane KPSS çalışma alanınla aynı kapsamda kalır.'],
    ['İlk soru: Hangi sınava hazırlanıyorsun?', 'KPSS rotanı oluşturmaya başla.'],
    ['Diğer sınava her zaman geçebilirsin.', 'Ayarlarını daha sonra güncelleyebilirsin.'],
    ['Sınav değiştir, kaydını koru', 'Rotanı güvenle koru'],
    ['Yedek dosyası iki sınavı da içerir. Yükleme, bu uygulamadaki mevcut kayıtların tamamını değiştirir; önce dışa aktar.', 'Yedek dosyası mevcut çalışma kayıtlarını içerir. Yükleme, bu uygulamadaki mevcut kayıtların tamamını değiştirir; önce dışa aktar.'],
    ['Bu işlem seçili sınavın yerel kayıtlarını siler. Diğer sınavın verilerine dokunmaz.', 'Bu işlem KPSS çalışma alanının yerel kayıtlarını siler.'],
    ['Bu sınavın tüm yerel kayıtları silinir. Önce yedek al. YKS kayıtların korunur.', 'KPSS çalışma alanının tüm yerel kayıtları silinir. Önce yedek al.']
  ];

  function cleanCopy(raw) {
    let value = raw;
    for (const [from, to] of copyReplacements) value = value.split(from).join(to);
    value = value
      .replace(/\bYKS\b/g, 'KPSS')
      .replace(/\bTYT\b|\bAYT\b|\bYDT\b/g, 'KPSS')
      .replace(/KPSS\s*(?:[,/+·]|ve)\s*KPSS(?:\s*(?:[,/+·]|ve)\s*KPSS)*/g, 'KPSS');
    return value;
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function scrubText(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const next = cleanCopy(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function scrubProductSurface() {
    document.querySelectorAll('[data-exam="yks"]').forEach((node) => node.remove());
    document.querySelectorAll('[data-scope="TYT"],[data-scope="AYT"],[data-scope="YDT"]').forEach((node) => node.remove());

    const academy = document.querySelector('.academy-grid');
    if (academy) {
      academy.querySelectorAll('.academy-course').forEach((card) => {
        const stage = (card.querySelector('.course-stage')?.textContent || '').trim();
        if (!stage.startsWith('KPSS')) card.remove();
      });
      const kpssSubjects = (window.RotaCatalog?.subjects || []).filter((subject) => subject.exam === PRIMARY_EXAM);
      const summary = document.querySelector('.academy-summary');
      const stats = summary?.querySelectorAll('.academy-mini-stats > div') || [];
      if (stats[0]) {
        setText(stats[0].querySelector('strong'), String(kpssSubjects.length));
        setText(stats[0].querySelector('span'), 'KPSS ders alanı');
      }
      if (stats[1]) {
        const topicCount = kpssSubjects.reduce((sum, subject) => sum + (subject.topics?.length || 0), 0);
        setText(stats[1].querySelector('strong'), String(topicCount));
        setText(stats[1].querySelector('span'), 'KPSS konu alanı');
      }
      if (stats[2]) stats[2].remove();
    }

    const prepGrid = document.querySelector('.v6-prep-grid');
    if (prepGrid) {
      prepGrid.style.gridTemplateColumns = 'minmax(0, 680px)';
      prepGrid.style.justifyContent = 'center';
    }

    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = 'KPSS Lisans Genel Yetenek ve Genel Kültür için kişiye özel çalışma rotası, deneme analizi, tekrar ve çalışma takibi.';
    scrubText();
  }

  function reconcile() {
    queued = false;
    scrubProductSurface();
    protectLegacyActiveExam();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(reconcile);
  }

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'choose-exam' && button.dataset.exam === LEGACY_EXAM) {
      event.preventDefault();
      event.stopImmediatePropagation();
      startKpss();
      return;
    }
    if (action === 'paid-start' || action === 'paid-free-start') {
      event.preventDefault();
      event.stopImmediatePropagation();
      startKpss();
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  } else {
    reconcile();
  }

  new MutationObserver(schedule).observe(document.documentElement, { subtree: true, childList: true });
})();

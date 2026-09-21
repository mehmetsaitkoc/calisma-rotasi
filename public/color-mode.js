/* Çalışma Rotası · day/night display mode
   Presentation-only preference. Does not touch Route Engine or workspace data. */
(() => {
  const ATTR = 'data-cr-color-mode';
  const STORAGE_KEY = 'calisma-rotasi:color-mode:v1';
  const LIGHT = 'light';
  const DARK = 'dark';
  let queued = false;

  function valid(mode) {
    return mode === LIGHT || mode === DARK;
  }

  function storedMode() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return valid(value) ? value : null;
    } catch {
      return null;
    }
  }

  function currentMode() {
    const value = document.documentElement.getAttribute(ATTR);
    return valid(value) ? value : LIGHT;
  }

  function buttonText(mode) {
    return mode === DARK
      ? { icon: '☀', label: 'Gündüz', aria: 'Gündüz moduna geç' }
      : { icon: '☾', label: 'Gece', aria: 'Gece moduna geç' };
  }

  function syncButtons() {
    const mode = currentMode();
    const copy = buttonText(mode);
    document.querySelectorAll('.cr-theme-toggle').forEach((button) => {
      button.dataset.mode = mode;
      button.setAttribute('aria-label', copy.aria);
      button.setAttribute('title', copy.aria);
      const icon = button.querySelector('.cr-theme-toggle-icon');
      const label = button.querySelector('.cr-theme-toggle-label');
      if (icon && icon.textContent !== copy.icon) icon.textContent = copy.icon;
      if (label && label.textContent !== copy.label) label.textContent = copy.label;
    });
  }

  function applyMode(mode, persist = true) {
    const next = valid(mode) ? mode : LIGHT;
    if (document.documentElement.getAttribute(ATTR) !== next) {
      document.documentElement.setAttribute(ATTR, next);
    }
    document.documentElement.style.colorScheme = next;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    }
    syncButtons();
    document.dispatchEvent(new CustomEvent('calisma-rotasi:color-mode', { detail: { mode: next } }));
  }

  function toggleMode() {
    applyMode(currentMode() === DARK ? LIGHT : DARK, true);
  }

  function makeButton(extraClass) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cr-theme-toggle ' + extraClass;
    button.innerHTML =
      '<span class="cr-theme-toggle-icon" aria-hidden="true"></span>' +
      '<span class="cr-theme-toggle-label"></span>';
    button.addEventListener('click', toggleMode);
    return button;
  }

  function ensureLandingToggle() {
    const host = document.querySelector('.premium-landing-final .v6-nav-actions');
    if (!host || host.querySelector('.cr-theme-toggle-landing')) return;
    host.prepend(makeButton('cr-theme-toggle-landing'));
  }

  function ensureAppToggle() {
    const topbar = document.querySelector('.app-shell .topbar');
    if (!topbar || topbar.querySelector('.cr-theme-toggle-app')) return;
    topbar.append(makeButton('cr-theme-toggle-app'));
  }

  function mount() {
    queued = false;
    ensureLandingToggle();
    ensureAppToggle();
    syncButtons();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(mount);
  }

  applyMode(storedMode() || LIGHT, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

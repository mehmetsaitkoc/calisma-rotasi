export function validateApiBase(value) {
  if (typeof value !== 'string' || !value) throw new Error('Native API adresi derleme sırasında tanımlanmalı.');
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || host === 'localhost' || host.endsWith('.localhost') || host === '[::1]' || /^127\./.test(host) || host === '0.0.0.0') {
    throw new Error('Native API adresi HTTPS origin olmalı; localhost veya kimlik bilgisi içeremez.');
  }
  return url.origin;
}
export function createNativeShell({ isNative, apiBase, secure, capturePhoto, dictate, shareFile, eventTarget = globalThis.window }) {
  const unavailable = async () => { throw Object.assign(new Error('Bu özellik Android uygulamasında kullanılabilir.'), { code: 'NATIVE_UNAVAILABLE' }); };
  const backHandlers = new Set();
  const native = Boolean(isNative);
  const base = native ? validateApiBase(apiBase) : '';
  const shell = {
    isNative: native,
    apiBase: base,
    ready: Promise.resolve(),
    secureSession: Object.freeze({
      async get() { if (!native) return null; const result = await secure.get(); return typeof result?.token === 'string' && result.token ? result.token : null; },
      async set(token) { if (!native) return unavailable(); if (typeof token !== 'string' || token.length < 16 || token.length > 8192 || /\s/.test(token)) throw new Error('Geçersiz oturum anahtarı.'); await secure.set({ token }); },
      async remove() { if (native) await secure.remove(); }
    }),
    capturePhoto: native ? capturePhoto : unavailable,
    dictate: native ? dictate : unavailable,
    shareFile: native ? shareFile : unavailable,
    onBack(callback) { if (typeof callback !== 'function') throw new TypeError('Geri tuşu işleyicisi fonksiyon olmalı.'); backHandlers.add(callback); return () => backHandlers.delete(callback); },
    async handleBack(detail, fallback) {
      for (const callback of [...backHandlers].reverse()) { if (await callback(detail) === true) return true; }
      if (eventTarget && typeof CustomEvent === 'function') {
        const event = new CustomEvent('rota:native-back', { detail, cancelable: true });
        eventTarget.dispatchEvent(event);
        if (event.defaultPrevented) return true;
      }
      await fallback();
      return false;
    }
  };
  return shell;
}

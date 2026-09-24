/* ES5 guard runs before the native application, including on vendor WebViews. */
(function () {
  var supported = typeof window.AbortSignal === 'function' &&
    typeof window.AbortSignal.timeout === 'function' &&
    typeof window.AbortSignal.any === 'function' &&
    typeof Array.prototype.at === 'function' &&
    window.crypto && typeof window.crypto.randomUUID === 'function' &&
    typeof window.structuredClone === 'function';
  if (!supported) window.location.replace('/native-unavailable.html?reason=webview');
})();

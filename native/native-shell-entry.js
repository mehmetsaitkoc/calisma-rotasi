import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Camera, MediaTypeSelection } from '@capacitor/camera';
import { Network } from '@capacitor/network';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { createNativeShell } from './native-shell-contract.js';

const secure = registerPlugin('RotaSecureSession');
const speech = registerPlugin('RotaSpeech');
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
async function photoResult(media) {
  if (!media?.webPath) throw new Error('Fotoğraf seçilmedi.');
  const image = new Image();
  image.src = media.webPath;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Fotoğraf okunamadı.');
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  if (dataUrl.length > 2_000_000) throw new Error('Fotoğraf çok büyük. Daha yakın bir görüntü seç.');
  return { dataUrl, name: `soru-${Date.now()}.jpg` };
}
const bridge = createNativeShell({
  isNative: Capacitor.isNativePlatform(),
  apiBase: __ROTA_API_BASE__,
  secure,
  async capturePhoto(options = {}) {
    const common = { quality: 82, targetWidth: 1600, targetHeight: 1600, includeMetadata: false, saveToGallery: false };
    const media = options.source === 'camera'
      ? await Camera.takePhoto(common)
      : (await Camera.chooseFromGallery({ ...common, mediaType: MediaTypeSelection.Photos, allowMultipleSelection: false, limit: 1 })).results?.[0];
    return photoResult(media);
  },
  dictate: () => speech.dictate(),
  async shareFile({ name, content, mimeType = 'application/json' }) {
    if (!/^[\w.\-]{1,100}$/.test(name)) throw new Error('Geçersiz dosya adı.');
    if (typeof content !== 'string' || content.length > 15_000_000) throw new Error('Dosya boyutu desteklenmiyor.');
    const file = await Filesystem.writeFile({ path: `exports/${name}`, data: content, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
    await Share.share({ title: name, url: file.uri, dialogTitle: 'Yedeğini kaydet veya paylaş' });
    return { name, mimeType };
  }
});
window.RotaNative = bridge;
if (bridge.isNative) {
  document.documentElement.classList.add('rota-native');
  const syncStatusBar = () => StatusBar.setStyle({ style: document.documentElement.getAttribute('data-cr-color-mode') === 'dark' ? Style.Dark : Style.Light });
  document.addEventListener('calisma-rotasi:color-mode', () => { void syncStatusBar().catch(() => {}); });
  bridge.ready = (async () => {
    await Promise.allSettled([
      App.addListener('backButton', detail => bridge.handleBack(detail, () => detail.canGoBack ? window.history.back() : App.minimizeApp())),
      App.addListener('appStateChange', detail => emit('rota:native-state', detail)),
      App.addListener('appRestoredResult', async result => {
        if (result.pluginId === 'Camera' && result.success) {
          try { emit('rota:native-photo-restored', await photoResult(result.data?.results?.[0] || result.data)); }
          catch { emit('rota:native-error', { code: 'PHOTO_RESTORE_FAILED', message: 'Fotoğraf geri yüklenemedi. Tekrar seçebilirsin.' }); }
        }
      }),
      Network.addListener('networkStatusChange', detail => emit('rota:native-network', detail)),
      Network.getStatus().then(detail => emit('rota:native-network', detail)),
      Keyboard.addListener('keyboardDidShow', detail => { document.documentElement.style.setProperty('--native-keyboard-height', `${detail.keyboardHeight}px`); emit('rota:native-keyboard', { visible: true, ...detail }); }),
      Keyboard.addListener('keyboardDidHide', () => { document.documentElement.style.setProperty('--native-keyboard-height', '0px'); emit('rota:native-keyboard', { visible: false }); }),
      syncStatusBar()
    ]);
    emit('rota:native-ready', { platform: Capacitor.getPlatform() });
  })();
}

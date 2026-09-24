# Android technical build and release gates

Checked 2026-09-24. First product scope: KPSS. No Play upload or production signing key was created. `app.rotasi.development` is a provisional build identity; the owner must choose the permanent application ID before the first store upload. Debug adds `.debug`.

## Reproducible build

Use Node from `.node-version` (24.21.0), JDK 21, Android SDK platform 36 and build-tools 36.0.0. Dependencies are exact-pinned in `package-lock.json`. Capacitor 8.5.2, AGP 8.13.0 and checksum-pinned Gradle 8.14.3 follow the [Capacitor 8 requirements](https://capacitorjs.com/docs/updating/8-0). Minimum Android API is 24; compile and target API are 36, satisfying the currently published [Play target API requirement](https://developer.android.com/google/play/requirements/target-sdk).

```sh
npm ci
npm run native:test
# Set JAVA_HOME, ANDROID_HOME and optionally GRADLE_USER_HOME to installed toolchains.
export ROTA_ANDROID_API_BASE=https://your-approved-api.example
npm run android:debug
npm run android:release
# Official Google bundletool 1.18.3, SHA-256:
# a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29
export BUNDLETOOL_JAR=/absolute/path/bundletool-all-1.18.3.jar
node scripts/android-verify.mjs debug
node scripts/android-verify.mjs release
```

`native-build.mjs` copies public assets and injects the landing CSS/JS that the web server otherwise supplies. All 256 test modules, 3072 original questions, branch blueprints and approved UI assets are bundled. `/native-shell.js` must load synchronously before account scripts. Its web build is inert; only the native staging bundle contains the supplied API origin. Missing/non-HTTPS/loopback API origins fail the build. The native shell uses `https://localhost` as its **local asset origin**, distinct from the remote HTTPS API; no live-reload URL or production localhost API fallback is used. [Capacitor configuration](https://capacitorjs.com/docs/config)

Reports in `work/android-build/` record artifact hashes, exact asset manifests and package verification. `android-verify.mjs` checks every web asset against the build manifest, APK identity/minimum/target SDK, requested permissions, APK ZIP alignment, 64-bit ELF LOAD alignment, debug/release signatures where present, and AAB structure plus `PAGE_ALIGNMENT_16K` using official bundletool. CameraX contains native `.so` files; this is not a Java-only package. [16 KB support](https://developer.android.com/guide/practices/page-sizes), [bundletool](https://github.com/google/bundletool)

## WebView compatibility

Android API level alone does not establish web API availability. `android.minWebViewVersion` is 116, matching the newest required API (`AbortSignal.any`, introduced in [Chrome116](https://developer.chrome.com/blog/chrome-116-beta)); `AbortSignal.timeout` exists from [Chrome103](https://developer.chrome.com/blog/new-in-chrome-103). Array.at, crypto.randomUUID and structuredClone are also required. Native staging inserts an ES5 feature guard before application scripts to cover vendor WebViews whose package version is not a Chromium version. Missing features redirect to a bundled, plugin-free update-help page. Capacitor's own minimum-version and main-frame error handling use the same `server.errorPath`. The page supplies WebView/Chrome store links and restart guidance; it never clears local data. This is a checked requirement, not a claim that every Android7+ OEM device was tested. [Official Capacitor minWebViewVersion/errorPath options](https://capacitorjs.com/docs/config)

## Native behavior

- The opaque account token is AES-256-GCM encrypted by an AndroidKeyStore key and stored as ciphertext/IV in app-private preferences. Fresh random IV and authenticated additional data are used. Authentication failures clear the ciphertext; there is no plaintext fallback. Android backup and device transfer are disabled for session storage. The web account adapter does not put bearer tokens in localStorage.
- Official App, Camera, Network, Keyboard, Status Bar, Filesystem and Share plugins are used. The system photo picker limits access to the selected photo. Camera8 uses `takePhoto`/`chooseFromGallery`; image bytes are resized and converted to JPEG before a user-authorized question send. No broad photo-library/storage permission is requested. [Camera API](https://capacitorjs.com/docs/apis/camera)
- Dictation launches the device's system recognition UI through `RecognizerIntent`; this app does not record microphone audio and requests no `RECORD_AUDIO` permission. The system service may require network access or may be unavailable. The text-entry fallback remains. [Android speech](https://developer.android.com/reference/android/speech/RecognizerIntent)
- `RotaNative.onBack` first lets the UI close a modal/menu or leave a detail screen; unhandled back uses history or minimizes the app. App lifecycle/network/keyboard events are forwarded to the account/UI adapter. Restored camera results are emitted as an event, not automatically attached to a possibly changed account. [App lifecycle](https://capacitorjs.com/docs/apis/app)
- User-requested exports use cache-only FileProvider URIs and the system share sheet. External content is not silently downloaded.

## Evidence and limits

An API36 AOSP arm64 emulator was installed in the workspace after explicit acceptance of the Android SDK license. Four application instrumentation tests passed: encrypted-at-rest session/recreated store and fresh IV; rejection of tampered ciphertext; concurrent first-key creation and atomic session writes across store instances; complete bundled bank and real native secure plugin roundtrip across Activity recreation, with no test bearer token in Web Storage. Use `npm run android:instrumentation` with `ANDROID_SERIAL` set to the designated test emulator. Do not target a personal device by default. `:app:connectedDebugAndroidTest` deliberately selects application tests; unrelated generated Cordova example instrumentation is not part of the app test suite.

These tests do not establish physical-device camera, speech-provider, permission-denial, OEM lifecycle, 16KB-runtime or store acceptance. The user confirmed no physical Android phone is available. AOSP's absence of a speech provider is a real supported error path, not proof of working dictation. The new account backend must still be deployed on durable HTTPS infrastructure with `ROTA_ALLOWED_ORIGINS` explicitly including `https://localhost`; old live endpoints are not evidence that the new backend is ready.

## Production signing and distribution

For a signed release, supply the owner-approved `ROTA_ANDROID_APP_ID`, monotonically increasing `ROTA_ANDROID_VERSION_CODE` and version name, plus all four signing variables: `ROTA_ANDROID_KEYSTORE`, `ROTA_ANDROID_STORE_PASSWORD`, `ROTA_ANDROID_KEY_ALIAS`, `ROTA_ANDROID_KEY_PASSWORD`. Values are not logged or committed. The build refuses incomplete signing configuration and refuses a signed release with the development ID. Keep the upload key in controlled private storage and document recovery. A conventional known debug key in ignored `work/` is only for technical testing; it is never a release key. [Android signing](https://developer.android.com/studio/publish/app-signing)

Owner decisions still required: permanent package ID, signing/Play App Signing ownership, developer account and retention policy. The confirmed developer/operator is Yasin Koç; privacy contact mehmetsaitkoc113@gmail.com is linked in the privacy/deletion pages. Real phone testing remains a release gate. A service account is needed only if automated Play upload is later chosen, not for building an AAB. New personal Play accounts may need a closed test with at least 12 continuously opted-in testers for 14 days before production access. [Testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465), [Publisher API setup](https://developers.google.com/android-publisher/getting_started)

The production-readiness workflow runs lockfile installs, backend/account/recovery/native contracts, sequential isolated browser tests and unsigned technical Android builds. It has no signing secrets or Play publication step. A green workflow is a technical check, not store approval.

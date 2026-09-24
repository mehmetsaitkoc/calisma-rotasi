import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { validateApiBase } from '../native/native-shell-contract.js';
const root = path.resolve(import.meta.dirname, '..');
const mode = process.argv[2] || 'debug';
if (!['debug','release'].includes(mode)) throw new Error('Usage: node scripts/android-build.mjs debug|release');
const apiBase = validateApiBase(process.env.ROTA_ANDROID_API_BASE || '');
const config = JSON.parse(await fs.readFile(path.join(root, 'capacitor.config.json'), 'utf8'));
const appId = process.env.ROTA_ANDROID_APP_ID || config.appId;
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(appId)) throw new Error('Invalid Android applicationId.');
const provisional = appId === 'app.rotasi.development';
const versionCode = Number(process.env.ROTA_ANDROID_VERSION_CODE || 1);
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) throw new Error('Invalid versionCode.');
const versionName = process.env.ROTA_ANDROID_VERSION_NAME || '4.2.0';
if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-.][A-Za-z0-9]+)*$/.test(versionName)) throw new Error('Invalid versionName.');
const signingNames = ['ROTA_ANDROID_KEYSTORE','ROTA_ANDROID_STORE_PASSWORD','ROTA_ANDROID_KEY_ALIAS','ROTA_ANDROID_KEY_PASSWORD'];
const signing = signingNames.every(name => Boolean(process.env[name]));
if (signingNames.some(name => Boolean(process.env[name])) && !signing) throw new Error('All four signing settings are required; none are printed.');
if (mode === 'release' && signing && provisional) throw new Error('Owner-approved applicationId required for signed release.');
if (!process.env.JAVA_HOME || !(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT)) throw new Error('JAVA_HOME and ANDROID_HOME are required.');
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} failed (${result.status}).`);
};
await fs.mkdir(path.join(root, 'work/android-build'), { recursive: true });
if (mode === 'debug') {
  const debugKey = path.join(root,'work/android-build/debug.keystore');
  try { await fs.access(debugKey); } catch {
    run(path.join(process.env.JAVA_HOME,'bin/keytool'), ['-genkeypair','-keystore',debugKey,'-storepass','android','-keypass','android','-alias','androiddebugkey','-keyalg','RSA','-keysize','2048','-validity','365','-dname','CN=Android Debug,O=Android,C=US','-noprompt']);
  }
}
run(process.execPath, ['scripts/native-build.mjs']);
run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android']);
const assetRecord = JSON.parse(await fs.readFile(path.join(root,'work/android-build/asset-manifest.json'),'utf8'));
for (const name of ['cordova.js','cordova_plugins.js']) {
  const bytes = await fs.readFile(path.join(root,'android/app/src/main/assets/public',name));
  assetRecord.files.push({path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),generatedBy:'capacitor-sync'});
}
await fs.writeFile(path.join(root,`work/android-build/${mode}-asset-manifest.json`),JSON.stringify(assetRecord,null,2)+'\n');
const tasks = mode === 'debug' ? ['lintDebug','testDebugUnitTest','assembleDebug'] : ['lintRelease','testReleaseUnitTest','assembleRelease','bundleRelease'];
run(path.join(root, 'android/gradlew'), ['--no-daemon','--console=plain',`-ProtaApplicationId=${appId}`,`-ProtaVersionCode=${versionCode}`,`-ProtaVersionName=${versionName}`,...tasks], path.join(root,'android'));
const candidates = mode === 'debug' ? ['apk/debug/app-debug.apk'] : [`apk/release/app-release${signing ? '' : '-unsigned'}.apk`,'bundle/release/app-release.aab'];
const artifacts = [];
for (const relative of candidates) {
  const source = path.join(root,'android/app/build/outputs',relative);
  const bytes = await fs.readFile(source);
  artifacts.push({ path: path.relative(root, source), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const report = { builtAt: new Date().toISOString(), mode, applicationId: appId + (mode === 'debug' ? '.debug' : ''), provisionalIdentity: provisional, versionCode, versionName, apiBase, signing: mode === 'debug' ? 'debug-only' : signing ? 'release-signed' : 'unsigned-technical-build', artifacts, physicalDeviceTested: false, playUploaded: false };
await fs.writeFile(path.join(root, `work/android-build/${mode}-build.json`), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));

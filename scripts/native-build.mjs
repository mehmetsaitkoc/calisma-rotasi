import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { validateApiBase } from '../native/native-shell-contract.js';
const root = path.resolve(import.meta.dirname, '..');
const webOnly = process.argv.includes('--web-bridge');
const apiBase = webOnly ? '' : validateApiBase(process.env.ROTA_ANDROID_API_BASE || '');
const output = webOnly ? path.join(root, 'public/native-shell.js') : path.join(root, 'native-web/native-shell.js');
if (!webOnly) {
  const destination = path.join(root, 'native-web');
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });
  await fs.cp(path.join(root, 'public'), destination, { recursive: true, filter: source => !path.basename(source).startsWith('.') });
  let html = await fs.readFile(path.join(destination, 'index.html'), 'utf8');
  html = html.replace('<head>', '<head><script src="/native-compat.js"></script>');
  if (!html.includes('href="/landing-final.css"')) html = html.replace('</head>', '<link rel="stylesheet" href="/landing-final.css"></head>');
  if (!html.includes('src="/landing-final.js"')) html = html.replace('</body>', '<script src="/landing-final.js" defer></script></body>');
  if (!html.includes('src="/native-shell.js"')) throw new Error('Root HTML must include /native-shell.js before the account client.');
  await fs.writeFile(path.join(destination, 'index.html'), html);
}
await build({ entryPoints: [path.join(root, 'native/native-shell-entry.js')], bundle: true, format: 'iife', platform: 'browser', target: ['chrome105'], outfile: output, define: { __ROTA_API_BASE__: JSON.stringify(apiBase) }, minify: true, legalComments: 'eof' });
if (!webOnly) {
  const manifest = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else { const bytes = await fs.readFile(file); manifest.push({ path: path.relative(path.join(root, 'native-web'), file), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
    }
  }
  await walk(path.join(root, 'native-web'));
  const tests = manifest.filter(item => /^questions\/kpss\/.+\/test-[1-4]\.js$/.test(item.path));
  if (tests.length !== 256) throw new Error(`Native bank payload must contain 256 tests; found ${tests.length}.`);
  for (const item of ['rota-journey-v8.webp','rota-dashboard.css','rota-foundations.css','landing-final.js','landing-final.css','native-compat.js','native-unavailable.html']) if (!manifest.some(file => file.path === item)) throw new Error(`Missing approved UI asset: ${item}`);
  await fs.mkdir(path.join(root, 'work/android-build'), { recursive: true });
  await fs.writeFile(path.join(root, 'work/android-build/asset-manifest.json'), JSON.stringify({ apiBase, tests: tests.length, files: manifest }, null, 2) + '\n');
  console.log(`Native assets: ${manifest.length} files, ${tests.length} tests, HTTPS API ${apiBase}`);
} else console.log('Web-inert native bridge generated.');

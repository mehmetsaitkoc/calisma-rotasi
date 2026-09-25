import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Public ownership token supplied by the site owner, not an authentication secret.
export const verificationToken = '42b-NIDbVKAChG--YHRvqoWgUc3iN-fRsrlppBAiuAY';
export const verificationTag = `<meta name="google-site-verification" content="${verificationToken}" />`;

export function withGoogleVerification(html) {
  if (typeof html !== 'string') throw new TypeError('HTML must be a string.');
  const opening = /<head\b[^>]*>/i.exec(html);
  const closing = /<\/head\s*>/i.exec(html);
  if (!opening || !closing || closing.index < opening.index + opening[0].length) {
    throw new Error('A complete HTML head is required for Google verification.');
  }
  const head = html.slice(opening.index + opening[0].length, closing.index);
  for (const [meta] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const name = /\bname\s*=\s*(["'])(.*?)\1/i.exec(meta)?.[2];
    const content = /\bcontent\s*=\s*(["'])(.*?)\1/i.exec(meta)?.[2];
    if (name === 'google-site-verification' && content === verificationToken) return html;
  }
  // Keep charset first and preserve all existing metadata, scripts and UI bytes.
  const charset = /<meta\b[^>]*\bcharset\s*=[^>]*>/i.exec(head);
  const at = opening.index + opening[0].length + (charset ? charset.index + charset[0].length : 0);
  return html.slice(0, at) + '\n' + verificationTag + html.slice(at);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const file = new URL('../public/index.html', import.meta.url);
  const original = fs.readFileSync(file, 'utf8');
  const prepared = withGoogleVerification(original);
  if (process.argv.includes('--check')) {
    if (prepared !== original) throw new Error('Google verification metadata has not been prepared.');
    console.log('Google verification metadata is present in the HTML head.');
  } else {
    // npm prestart and preweb:static run this before the server/build reads HTML.
    // Repeated starts are idempotent; no browser-side JavaScript is required.
    if (prepared !== original) fs.writeFileSync(file, prepared, 'utf8');
    console.log('Google verification metadata prepared.');
  }
}

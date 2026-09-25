import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Public ownership proof supplied by the site owner; not a login credential.
export const verificationToken = '42b-NIDbVKAChG--YHRvqoWgUc3iN-fRsrlppBAiuAY';
export const verificationTag = `<meta name="google-site-verification" content="${verificationToken}" />`;

/** Add one verification tag without changing the app or other owners' tags. */
export function withGoogleVerification(html) {
  if (typeof html !== 'string') throw new TypeError('Expected HTML text.');
  const opening = /<head\b[^>]*>/i.exec(html);
  const closing = /<\/head\s*>/i.exec(html);
  if (!opening || !closing || closing.index < opening.index) {
    throw new Error('No complete HTML head found; the page was not changed.');
  }
  const insertion = opening.index + opening[0].length;
  const head = html.slice(insertion, closing.index).replace(/<!--[\s\S]*?-->/g, '');
  const tags = head.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = /\sname\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2];
    const content = /\scontent\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2];
    if (name === 'google-site-verification' && content === verificationToken) return html;
  }
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  return html.slice(0, insertion) + newline + verificationTag + html.slice(insertion);
}

// Run before the existing server/static build reads or compresses index.html.
// Idempotent on restarts; no request-time rewriting and no external calls.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = new URL('../public/index.html', import.meta.url);
  const original = readFileSync(index, 'utf8');
  const updated = withGoogleVerification(original);
  if (updated !== original) writeFileSync(index, updated, 'utf8');
  console.log('Google site verification tag is ready in the homepage head.');
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { withGoogleVerification, verificationTag, verificationToken } from './google-site-verification.mjs';
import { mergeHeadMetadata } from '../server/html-head.mjs';

const original = '<!doctype html>\n<html lang="tr"><head>\n<meta charset="utf-8">\n<title>Çalışma Rotası</title>\n</head><body><script>const untouched = true;</script></body></html>';
const prepared = withGoogleVerification(original);
assert.equal(prepared.replace('\n' + verificationTag, ''), original);
assert.ok(prepared.indexOf('charset="utf-8"') < prepared.indexOf(verificationTag));
assert.ok(prepared.indexOf(verificationTag) < prepared.indexOf('</head>'));
assert.equal(withGoogleVerification(prepared), prepared);
assert.equal(prepared.split(verificationToken).length - 1, 1);

const otherOwner = original.replace('</head>', '<meta name="google-site-verification" content="another-owner" /></head>');
assert.ok(withGoogleVerification(otherOwner).includes('content="another-owner"'));
assert.ok(withGoogleVerification(otherOwner).includes(verificationTag));
const alternate = original.replace('</head>', `<meta content='${verificationToken}' name='google-site-verification'></head>`);
assert.equal(withGoogleVerification(alternate), alternate);
const bodyOnly = original.replace('</body>', verificationTag + '</body>');
assert.ok(withGoogleVerification(bodyOnly).split('</head>')[0].includes(verificationTag));
assert.ok(withGoogleVerification('<HTML><HEAD></HEAD><BODY></BODY></HTML>').includes(verificationTag));
assert.throws(() => withGoogleVerification('<body>no head</body>'));
assert.throws(() => withGoogleVerification('<head>incomplete'));
assert.throws(() => withGoogleVerification(null), TypeError);

// Check the real application shell without rewriting its body or removing other metadata.
const source = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const result = withGoogleVerification(source);
assert.equal(withGoogleVerification(result), result);
assert.ok(result.split(/<\/head\s*>/i)[0].includes(verificationToken));
if (result !== source) assert.equal(result.replace('\n' + verificationTag, ''), source);
console.log('Google verification: head placement, charset order, idempotence, other-owner preservation and unchanged application shell passed.');

// Regression: PR #69 added static social tags already emitted by the server.
// Keep the browser's strict single-element assertion; fix the delivered HTML.
const oldSocial = '<meta property="og:title" content="old"><meta content="old2" property=\'OG:TITLE\'><meta name="twitter:card" content="summary">';
const protectedTags = '<meta name="robots" content="index,follow"><link rel="canonical" href="https://calisma-rotasi.onrender.com/">' + verificationTag;
const currentSocial = '<meta property="og:title" content="Çalışma Rotası"><meta name="twitter:card" content="summary_large_image">';
const socialSource = original.replace('</head>', oldSocial + protectedTags + '</head>');
const merged = mergeHeadMetadata(socialSource, currentSocial);
assert.equal((merged.match(/property=["']og:title["']/gi) || []).length, 1);
assert.equal((merged.match(/name="twitter:card"/g) || []).length, 1);
assert.ok(merged.includes(currentSocial));
assert.ok(merged.includes(protectedTags));
assert.equal(merged.split('</head>')[1], original.split('</head>')[1]);
assert.equal(mergeHeadMetadata(merged, currentSocial), merged);
assert.ok(mergeHeadMetadata(original, currentSocial).includes(currentSocial));
const examples = '<script>const example = \'<meta property="og:title" content="example">\';</script><!-- <meta property="og:title" content="comment"> -->';
assert.ok(mergeHeadMetadata(socialSource.replace('</head>', examples + '</head>'), currentSocial).includes(examples));
assert.throws(() => mergeHeadMetadata('<body>missing head</body>', currentSocial));
assert.throws(() => mergeHeadMetadata(null, currentSocial), TypeError);
const actualMerged = mergeHeadMetadata(result, currentSocial);
assert.equal((actualMerged.split('</head>')[0].match(/property="og:title"/g) || []).length, 1);
assert.ok(actualMerged.includes(verificationTag));
console.log('Social metadata: single server-owned values, unchanged verification/canonical/robots/body, preserved examples and idempotence passed.');

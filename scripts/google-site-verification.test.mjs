import assert from 'node:assert/strict';
import test from 'node:test';
import { withGoogleVerification, verificationToken, verificationTag } from './google-site-verification.mjs';

const page = '<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n<title>Çalışma Rotası</title>\n</head>\n<body><script>const state = "öğrenci";</script></body></html>';

test('inserts the exact owner-supplied tag inside head; every other byte is preserved', () => {
  const updated = withGoogleVerification(page);
  assert.equal(updated.replace('\n' + verificationTag, ''), page);
  assert.ok(updated.indexOf(verificationTag) < updated.indexOf('</head>'));
  assert.ok(updated.indexOf('charset="utf-8"') < 1024);
  assert.equal(verificationToken, '42b-NIDbVKAChG--YHRvqoWgUc3iN-fRsrlppBAiuAY');
});

test('repeated startup does not duplicate the tag', () => {
  const updated = withGoogleVerification(page);
  assert.equal(withGoogleVerification(updated), updated);
});

test('preserves another owners verification', () => {
  const other = '<meta name="google-site-verification" content="another-owner" />';
  const original = page.replace('<head>', '<head>\n' + other);
  assert.equal(withGoogleVerification(original).replace('\n' + verificationTag, ''), original);
});

test('recognizes an existing tag with single quotes and reversed attributes', () => {
  const tag = `<meta content='${verificationToken}' name='google-site-verification'>`;
  const original = page.replace('<head>', '<head>' + tag);
  assert.equal(withGoogleVerification(original), original);
});

test('a comment or body tag is not accepted as a head verification', () => {
  const comment = page.replace('<head>', '<head><!--' + verificationTag + '-->');
  const body = page.replace('<body>', '<body>' + verificationTag);
  assert.equal(withGoogleVerification(comment).replace('\n' + verificationTag, ''), comment);
  assert.equal(withGoogleVerification(body).replace('\n' + verificationTag, ''), body);
});

test('preserves CRLF line endings', () => {
  const original = page.replace(/\n/g, '\r\n');
  assert.equal(withGoogleVerification(original).replace('\r\n' + verificationTag, ''), original);
});

test('fails before changing a missing or malformed head', () => {
  assert.throws(() => withGoogleVerification('<html><body>hello</body></html>'));
  assert.throws(() => withGoogleVerification('</head><head>'));
  assert.throws(() => withGoogleVerification(null), TypeError);
});

test('handles a large page without touching application code', () => {
  const original = page.replace('</body>', 'x'.repeat(1400000) + '</body>');
  assert.equal(withGoogleVerification(original).replace('\n' + verificationTag, ''), original);
});

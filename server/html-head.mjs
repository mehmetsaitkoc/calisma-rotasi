// Merge server-owned social metadata into a static HTML head, without touching
// body/script content, canonical/robots tags or Google ownership verification.
const metaKey = tag => {
  const match = /\s(name|property)\s*=\s*(["'])(.*?)\2/i.exec(tag);
  return match ? match[1].toLowerCase() + ':' + match[3].toLowerCase() : '';
};

export function mergeHeadMetadata(html, metadata) {
  if (typeof html !== 'string' || typeof metadata !== 'string') throw new TypeError('HTML and metadata must be strings.');
  const keys = new Set([...metadata.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => metaKey(tag)).filter(Boolean));
  let found = false;
  const result = html.replace(/(<head\b[^>]*>)([\s\S]*?)(<\/head\s*>)/i, (_, open, head, close) => {
    found = true;
    // Script/style text and comments may contain example <meta> strings.
    // Keep those bytes intact; replace only actual matching head meta elements.
    const cleaned = head.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<meta\b[^>]*>/gi, tag => {
      if (!/^<meta\b/i.test(tag)) return tag;
      return keys.has(metaKey(tag)) ? '' : tag;
    });
    return open + cleaned + metadata + close;
  });
  if (!found) throw new Error('A complete HTML head is required.');
  return result;
}

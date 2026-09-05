const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ESC[c]);
}

function attr(obj) {
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === false || v === null || v === undefined) continue;
    out += v === true ? ` ${k}` : ` ${k}="${esc(v)}"`;
  }
  return out;
}

function img({ src, alt, width, height, eager = false, className = null, sizes = null }) {
  if (alt === undefined || alt === null) throw new Error(`img() requires alt: ${src}`);
  if (!width || !height) throw new Error(`img() requires width and height: ${src}`);
  return `<img${attr({
    src, alt, width, height, class: className, sizes,
    loading: eager ? false : 'lazy',
    decoding: eager ? false : 'async'
  })}>`;
}

module.exports = { esc, attr, img };

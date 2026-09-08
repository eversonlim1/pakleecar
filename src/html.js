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

const PICTURE_WIDTHS = [480, 960, 1440];

function picture({ src, alt, width, height, sizes = '100vw', eager = false, className = null }) {
  if (alt === undefined || alt === null) throw new Error(`picture() requires alt: ${src}`);
  const dir = src.replace(/\/[^/]+$/, '') + '/opt';
  const name = src.split('/').pop().replace(/\.[^.]+$/, '');
  const set = ext => PICTURE_WIDTHS.map(w => `${dir}/${name}-${w}.${ext} ${w}w`).join(', ');
  return `<picture>
<source type="image/avif" srcset="${set('avif')}" sizes="${esc(sizes)}">
<source type="image/webp" srcset="${set('webp')}" sizes="${esc(sizes)}">
${img({ src: `${dir}/${name}-960.jpg`, alt, width, height, eager, className })}
</picture>`;
}

module.exports = { esc, attr, img, picture };

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

const path = require('node:path');
const fs = require('node:fs');

const PICTURE_WIDTHS = [480, 960, 1440];
const MANIFEST_PATH = path.join(__dirname, '..', 'assets', 'img', 'opt', 'manifest.json');

// scripts/images.js writes this after each `npm run images` run, recording
// exactly which widths it generated per source (never upscaled past the
// source's own width, and always at least one). picture() must only ever
// reference widths that manifest says actually exist on disk — otherwise a
// source narrower than 960/1440 (e.g. the reel thumbnails, some as narrow as
// 360px) would emit <source>/<img> paths that 404 in production.
function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function picture({ src, alt, width, height, sizes = '100vw', eager = false, className = null }) {
  if (alt === undefined || alt === null) throw new Error(`picture() requires alt: ${src}`);
  const dir = src.replace(/\/[^/]+$/, '') + '/opt';
  const name = src.split('/').pop().replace(/\.[^.]+$/, '');
  const manifest = readManifest();
  const widths = (manifest[src] && manifest[src].length) ? manifest[src] : PICTURE_WIDTHS;
  const set = ext => widths.map(w => `${dir}/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallbackW = widths.includes(960) ? 960 : widths[widths.length - 1];
  return `<picture>
<source type="image/avif" srcset="${set('avif')}" sizes="${esc(sizes)}">
<source type="image/webp" srcset="${set('webp')}" sizes="${esc(sizes)}">
${img({ src: `${dir}/${name}-${fallbackW}.jpg`, alt, width, height, eager, className })}
</picture>`;
}

module.exports = { esc, attr, img, picture };

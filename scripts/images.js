const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'assets', 'img');
const WIDTHS = [480, 960, 1440];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'opt') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jpg|jpeg|png)$/i.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  const files = walk(SRC);
  const manifest = {};

  for (const input of files) {
    const outDir = path.join(path.dirname(input), 'opt');
    fs.mkdirSync(outDir, { recursive: true });
    const name = path.parse(input).name;
    const meta = await sharp(input).metadata();
    const nativeWidth = meta.width || WIDTHS[0];

    // Generate one derivative per target width, but never upscale: a target
    // wider than the source is clamped to the source's own width. Widths that
    // clamp to the same value are only generated once, so a narrow source
    // (e.g. a 360px or 640px reel thumbnail) still always gets at least one
    // real derivative instead of silently producing none.
    const generated = [];
    const seen = new Set();
    for (const w of WIDTHS) {
      const targetW = Math.min(w, nativeWidth);
      if (seen.has(targetW)) continue;
      seen.add(targetW);
      const base = sharp(input).resize({ width: targetW, withoutEnlargement: true });
      await base.clone().avif({ quality: 55 }).toFile(path.join(outDir, `${name}-${targetW}.avif`));
      await base.clone().webp({ quality: 72 }).toFile(path.join(outDir, `${name}-${targetW}.webp`));
      await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(outDir, `${name}-${targetW}.jpg`));
      generated.push(targetW);
    }

    const webPath = '/assets/img/' + path.relative(SRC, input).split(path.sep).join('/');
    manifest[webPath] = generated;
    console.log('optimised', path.relative(SRC, input), '->', generated.join(','));
  }

  const manifestDir = path.join(SRC, 'opt');
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}
main();

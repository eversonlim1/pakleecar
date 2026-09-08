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
  for (const input of files) {
    const outDir = path.join(path.dirname(input), 'opt');
    fs.mkdirSync(outDir, { recursive: true });
    const name = path.parse(input).name;
    const meta = await sharp(input).metadata();
    for (const w of WIDTHS) {
      if (meta.width && meta.width < w) continue;
      const base = sharp(input).resize({ width: w, withoutEnlargement: true });
      await base.clone().avif({ quality: 55 }).toFile(path.join(outDir, `${name}-${w}.avif`));
      await base.clone().webp({ quality: 72 }).toFile(path.join(outDir, `${name}-${w}.webp`));
      await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(outDir, `${name}-${w}.jpg`));
    }
    console.log('optimised', path.relative(SRC, input));
  }
}
main();

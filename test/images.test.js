const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { picture } = require('../src/html');

test('picture가 avif·webp·jpg 순서로 소스를 낸다', () => {
  const out = picture({ src: '/assets/img/staria-ext.jpg', alt: '차', width: 720, height: 960 });
  const avif = out.indexOf('image/avif');
  const webp = out.indexOf('image/webp');
  assert.ok(avif > -1 && webp > -1 && avif < webp);
  assert.match(out, /<img[^>]*src="[^"]*\.jpg"/);
});

test('picture가 3개 폭의 srcset을 만든다', () => {
  const out = picture({ src: '/assets/img/staria-ext.jpg', alt: '차', width: 720, height: 960 });
  for (const w of [480, 960, 1440]) assert.match(out, new RegExp(`-${w}\\.avif ${w}w`));
});

test('생성된 최적화 이미지가 원본보다 작다', () => {
  const orig = path.join(__dirname, '..', 'assets/img/staria-ext.jpg');
  const opt = path.join(__dirname, '..', 'assets/img/opt/staria-ext-960.avif');
  if (!fs.existsSync(opt)) { console.log('skip: npm run images 미실행'); return; }
  assert.ok(fs.statSync(opt).size < fs.statSync(orig).size);
});

test('원본 이미지가 1.5MB를 넘지 않는다', () => {
  const dir = path.join(__dirname, '..', 'assets/img');
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(jpg|png)$/i.test(f)) continue;
    const size = fs.statSync(path.join(dir, f)).size;
    assert.ok(size < 1_500_000, `${f}가 ${size} bytes`);
  }
});

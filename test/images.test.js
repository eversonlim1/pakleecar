const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { picture } = require('../src/html');

const MANIFEST_PATH = path.join(__dirname, '..', 'assets/img/opt/manifest.json');
const HAS_MANIFEST = fs.existsSync(MANIFEST_PATH);

test('picture가 avif·webp·jpg 순서로 소스를 낸다', () => {
  const out = picture({ src: '/assets/img/staria-ext.jpg', alt: '차', width: 720, height: 960 });
  const avif = out.indexOf('image/avif');
  const webp = out.indexOf('image/webp');
  assert.ok(avif > -1 && webp > -1 && avif < webp);
  assert.match(out, /<img[^>]*src="[^"]*\.jpg"/);
});

test('picture가 3개 폭의 srcset을 만든다 (넓은 원본)', () => {
  // hero-bg.jpg는 1920px 원본이라 480/960/1440 세 폭 모두 실제로 생성된다.
  const out = picture({ src: '/assets/img/hero-bg.jpg', alt: '차', width: 720, height: 960 });
  for (const w of [480, 960, 1440]) assert.match(out, new RegExp(`-${w}\\.avif ${w}w`));
});

test('picture가 원본보다 넓은 폭은 절대 만들지 않는다 (좁은 원본)', () => {
  // 릴 썸네일 DY3AtNlolDz.jpg는 640px 원본이라 960/1440 파생물이 없다 —
  // srcset과 fallback img 모두 640px을 넘는 후보를 내면 안 된다 (404 방지).
  if (!HAS_MANIFEST) { console.log('skip: npm run images 미실행'); return; }
  const out = picture({ src: '/assets/img/reels/DY3AtNlolDz.jpg', alt: '릴', width: 720, height: 900, eager: true });
  assert.doesNotMatch(out, /-960\./);
  assert.doesNotMatch(out, /-1440\./);
  const imgSrc = out.match(/<img[^>]*src="([^"]+)"/)[1];
  const imgWidth = Number(imgSrc.match(/-(\d+)\.jpg$/)[1]);
  assert.ok(imgWidth <= 640, `fallback img가 원본(640px)보다 넓은 ${imgWidth}px를 참조함`);
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

test('picture()가 만들 수 있는 모든 파일이 실제로 디스크에 존재한다', () => {
  if (!HAS_MANIFEST) { console.log('skip: npm run images 미실행'); return; }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const cases = [
    { src: '/assets/img/staria-ext.jpg', alt: 'x', width: 1, height: 1 },
    { src: '/assets/img/hero-bg.jpg', alt: 'x', width: 1, height: 1 },
    { src: '/assets/img/reels/DY3AtNlolDz.jpg', alt: 'x', width: 1, height: 1 },
    { src: '/assets/img/reels/DciyJZzI3Rq.jpg', alt: 'x', width: 1, height: 1 }
  ];
  for (const c of cases) {
    const out = picture(c);
    const paths = [...out.matchAll(/(?:srcset|src)="([^"]+)"/g)]
      .flatMap(m => m[1].split(',').map(s => s.trim().split(' ')[0]))
      .filter(Boolean);
    assert.ok(paths.length > 0, `${c.src}: 경로를 찾지 못함`);
    for (const p of paths) {
      const abs = path.join(__dirname, '..', p.replace(/^\//, ''));
      assert.ok(fs.existsSync(abs), `${c.src} -> ${p} 가 디스크에 없음`);
    }
    // manifest에 없는 폭을 절대 참조하지 않는다
    const widths = manifest[c.src];
    for (const p of paths) {
      const w = Number(p.match(/-(\d+)\.\w+$/)[1]);
      assert.ok(widths.includes(w), `${c.src}: manifest에 없는 폭 ${w}을 참조함`);
    }
  }
});

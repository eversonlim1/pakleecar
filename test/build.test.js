const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

test('빌드가 성공한다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  assert.ok(fs.existsSync(DIST));
});

test('4개 언어의 홈이 생성된다', () => {
  for (const l of ['id', 'en', 'es', 'ja']) {
    assert.ok(fs.existsSync(path.join(DIST, l, 'index.html')), `${l} 홈 누락`);
  }
});

test('홈에 canonical과 5개 hreflang이 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.match(h, /rel="canonical"/);
  assert.strictEqual((h.match(/rel="alternate"/g) || []).length, 5);
});

test('홈에 LocalBusiness 스키마가 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.match(h, /"@type":"LocalBusiness"/);
});

test('홈에 iframe이 없다 (파사드 유지)', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.doesNotMatch(h, /<iframe[^>]*src="https/);
});

test('홈 HTML이 60KB 미만이다', () => {
  const size = fs.statSync(path.join(DIST, 'en', 'index.html')).size;
  assert.ok(size < 60000, `홈이 ${size} bytes로 너무 크다`);
});

test('모든 img에 width/height/alt가 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  for (const tag of h.match(/<img[^>]*>/g) || []) {
    assert.match(tag, /width="/, tag);
    assert.match(tag, /height="/, tag);
    assert.match(tag, /alt="/, tag);
  }
});

test('h1이 페이지당 정확히 하나다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.strictEqual((h.match(/<h1/g) || []).length, 1);
});

test('site.css의 갤러리 규칙이 img 대상이고 dead anchor 규칙이 없다', () => {
  const css = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'site.css'), 'utf8');
  assert.doesNotMatch(css, /\.gal a/);
  assert.match(css, /\.gal img:first-child/);
});

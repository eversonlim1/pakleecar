const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const read = p => fs.readFileSync(path.join(DIST, p), 'utf8');

test('15종 × 5언어 + 예약 폼 × 5언어 = 80개 HTML이 생성된다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  let n = 0;
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') n++;
  });
  for (const l of ['id', 'en', 'es', 'ja', 'th']) walk(path.join(DIST, l));
  assert.strictEqual(n, 80);
});

test('가이드 글에 Article 스키마가 있다', () => {
  assert.match(read('en/guide/halal-food-seoul/index.html'), /"@type":"Article"/);
});

test('가이드 글이 투어 페이지로 내부링크한다', () => {
  const h = read('en/guide/halal-food-seoul/index.html');
  assert.ok((h.match(/href="\/en\/(tours\/|muslim-)/g) || []).length >= 2);
});

test('영상 페이지에 릴 6개와 VideoObject 6개가 있다', () => {
  const h = read('en/videos/index.html');
  assert.strictEqual((h.match(/data-reel=/g) || []).length, 6);
  assert.strictEqual((h.match(/"@type":"VideoObject"/g) || []).length, 6);
});

test('공유투어 페이지가 예약 API를 호출한다', () => {
  assert.match(read('en/share-tour/index.html'), /\/api\/bookings/);
});

test('예약 완료 페이지는 언어 공통 /thanks/ 하나이고 noindex, 사이트맵에 없다', () => {
  const t = fs.readFileSync(path.join(DIST, 'thanks', 'index.html'), 'utf8');
  assert.match(t, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(t, /G-0CHW93PTKZ/);
  for (const l of ['id', 'en', 'es', 'ja', 'th']) {
    assert.ok(t.includes(require(`../content/${l}/thanks.json`).h1), `${l} copy missing from /thanks/`);
    assert.ok(!fs.existsSync(path.join(DIST, l, 'thanks')), `${l}/thanks should not exist`);
    const b = fs.readFileSync(path.join(DIST, l, 'book', 'index.html'), 'utf8');
    assert.match(b, new RegExp(`var thanks = "/thanks/\\?l=${l}"`));
    assert.match(b, /wa\.me\/821094157859\?text=/);
  }
  const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /\/thanks\//);
  assert.doesNotMatch(sitemap, /\/book\//);
});

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function allHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) allHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

test('루트에 구 index.html이 남아있지 않다', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'index.html')));
});

test('어떤 페이지에도 data-id/data-en 속성이 없다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(h, /data-(id|en|th)="/, f);
  }
});

test('모든 페이지가 canonical과 정확히 1개의 h1을 갖는다', () => {
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    assert.match(h, /rel="canonical"/, f);
    assert.strictEqual((h.match(/<h1[\s>]/g) || []).length, 1, f);
  }
});

test('내부 링크가 모두 실제 파일로 해석된다', () => {
  const missing = [];
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const href = m[1];
      if (href.startsWith('/api/') || href.startsWith('/assets/')) continue;
      const target = path.join(DIST, href, 'index.html');
      if (!fs.existsSync(target) && !fs.existsSync(path.join(DIST, href))) {
        missing.push(`${path.relative(DIST, f)} → ${href}`);
      }
    }
  }
  assert.deepStrictEqual(missing, []);
});

test('모든 페이지에 JSON-LD가 있고 파싱된다', () => {
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, `${f}: JSON-LD 없음`);
    assert.doesNotThrow(() => JSON.parse(m[1].replace(/\\u003c/g, '<')), f);
  }
});

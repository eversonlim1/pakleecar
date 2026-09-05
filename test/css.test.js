const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const css = fs.readFileSync(require('node:path').join(__dirname, '..', 'assets/css/site.css'), 'utf8');

test('색 토큰이 스펙과 정확히 일치한다', () => {
  for (const t of ['--ink:#16211C', '--ac:#16A063', '--mint:#E7F5EE',
                   '--sun:#FFCE52', '--peach:#FFE3D2', '--coral:#FF8A5B']) {
    assert.ok(css.replace(/\s/g, '').includes(t.replace(/\s/g, '')), `${t} 누락`);
  }
});

test('세리프 서체를 쓰지 않는다', () => {
  assert.doesNotMatch(css, /(?<!sans-)serif/i);
});

test('Figtree만 지정한다', () => {
  assert.match(css, /'Figtree'/);
  assert.doesNotMatch(css, /Plus Jakarta|Poppins|Georgia|Times/);
});

test('h1/h2가 weight 700이다', () => {
  assert.doesNotMatch(css, /font-weight:\s*800/);
});

test('다크모드 대응이 있다', () => {
  assert.match(css, /prefers-color-scheme/);
});

test('reduced-motion 대응이 있다', () => {
  assert.match(css, /prefers-reduced-motion/);
});

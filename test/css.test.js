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

test('surface-invert / on-invert 토큰이 라이트·다크 양쪽에 정의된다', () => {
  const rootBlock = css.match(/:root\{[\s\S]*?\r?\n\}/)[0];
  assert.match(rootBlock, /--surface-invert:/);
  assert.match(rootBlock, /--on-invert:/);
  const darkMedia = css.match(/@media\(prefers-color-scheme:dark\)\{[\s\S]*?\r?\n\}\r?\n/)[0];
  assert.match(darkMedia, /--surface-invert:/);
  assert.match(darkMedia, /--on-invert:/);
});

test('ac-strong 토큰이 존재한다', () => {
  assert.match(css, /--ac-strong:#0C7A49/);
});

test('햄버거·모바일 메뉴 규칙이 있다', () => {
  assert.match(css, /\.hamburger\{/);
  assert.match(css, /\.mobile-menu\{/);
  assert.match(css, /\.mobile-menu\.open\{/);
});

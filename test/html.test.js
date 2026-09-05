const test = require('node:test');
const assert = require('node:assert');
const { esc, attr, img } = require('../src/html');
const { pageUrl, LANGS } = require('../build.config');

test('esc가 HTML 특수문자를 이스케이프한다', () => {
  assert.strictEqual(esc('<a href="x">&'), '&lt;a href=&quot;x&quot;&gt;&amp;');
});

test('esc가 null/undefined를 빈 문자열로 만든다', () => {
  assert.strictEqual(esc(null), '');
  assert.strictEqual(esc(undefined), '');
});

test('attr이 false/null 값을 건너뛴다', () => {
  assert.strictEqual(attr({ class: 'a', hidden: false, id: null }), ' class="a"');
});

test('attr이 true를 빈 속성으로 만든다', () => {
  assert.strictEqual(attr({ async: true }), ' async');
});

test('img가 width/height/alt/loading을 강제한다', () => {
  const out = img({ src: 'a.jpg', alt: '차량', width: 800, height: 600 });
  assert.match(out, /width="800"/);
  assert.match(out, /height="600"/);
  assert.match(out, /alt="차량"/);
  assert.match(out, /loading="lazy"/);
});

test('img에 eager를 주면 loading=lazy를 붙이지 않는다', () => {
  const out = img({ src: 'a.jpg', alt: 'x', width: 1, height: 1, eager: true });
  assert.doesNotMatch(out, /loading="lazy"/);
});

test('img는 alt가 없으면 던진다', () => {
  assert.throws(() => img({ src: 'a.jpg', width: 1, height: 1 }), /alt/);
});

test('pageUrl이 언어별 경로를 만든다', () => {
  assert.strictEqual(pageUrl('en', 'home'), '/en/');
  assert.strictEqual(pageUrl('id', 'tours/dmz'), '/id/tours/dmz/');
});

test('LANGS는 th를 포함하지 않는다', () => {
  assert.deepStrictEqual(LANGS, ['id', 'en', 'es', 'ja']);
});

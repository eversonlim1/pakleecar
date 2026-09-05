const test = require('node:test');
const assert = require('node:assert');
const { load, assertSeo } = require('../src/content');

test('load가 해당 언어 JSON을 읽는다', () => {
  const d = load('en', 'home');
  assert.strictEqual(typeof d.seo.title, 'string');
  assert.ok(d.seo.title.length > 0);
});

test('load가 없는 언어 키를 en으로 폴백한다', () => {
  const d = load('es', 'home');
  assert.ok(d.seo.title.length > 0);
});

test('assertSeo가 title 누락 시 던진다', () => {
  assert.throws(() => assertSeo({ seo: { description: 'x' } }, 'en/home'), /title/);
});

test('assertSeo가 description 누락 시 던진다', () => {
  assert.throws(() => assertSeo({ seo: { title: 'x' } }, 'en/home'), /description/);
});

test('assertSeo가 title 60자 초과 시 던진다', () => {
  assert.throws(
    () => assertSeo({ seo: { title: 'x'.repeat(61), description: 'y' } }, 'en/home'),
    /60/
  );
});

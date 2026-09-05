const test = require('node:test');
const assert = require('node:assert');
const { head, hreflangs } = require('../src/seo');

const seo = { title: 'T', description: 'D', ogImage: '/a.jpg' };

test('hreflang이 4개 언어 + x-default를 만든다', () => {
  const out = hreflangs('home');
  assert.strictEqual((out.match(/rel="alternate"/g) || []).length, 5);
  assert.match(out, /hreflang="x-default"/);
  assert.match(out, /hreflang="id"[^>]*\/id\//);
  assert.match(out, /hreflang="ja"[^>]*\/ja\//);
});

test('x-default는 루트를 가리킨다', () => {
  assert.match(hreflangs('home'), /hreflang="x-default" href="https:\/\/pakleecar\.vercel\.app\/"/);
});

test('head가 canonical을 절대 URL로 넣는다', () => {
  const out = head({ lang: 'en', slug: 'tours/dmz', seo });
  assert.match(out, /<link rel="canonical" href="https:\/\/pakleecar\.vercel\.app\/en\/tours\/dmz\/">/);
});

test('head가 title과 og:title을 넣는다', () => {
  const out = head({ lang: 'en', slug: 'home', seo });
  assert.match(out, /<title>T<\/title>/);
  assert.match(out, /property="og:title" content="T"/);
});

test('head가 og:image를 절대 URL로 만든다', () => {
  const out = head({ lang: 'en', slug: 'home', seo });
  assert.match(out, /og:image" content="https:\/\/pakleecar\.vercel\.app\/a\.jpg"/);
});

test('head가 og:locale을 언어에 맞게 넣는다', () => {
  assert.match(head({ lang: 'ja', slug: 'home', seo }), /og:locale" content="ja_JP"/);
  assert.match(head({ lang: 'id', slug: 'home', seo }), /og:locale" content="id_ID"/);
});

test('head가 Figtree 폰트를 preconnect와 함께 로드한다', () => {
  const out = head({ lang: 'en', slug: 'home', seo });
  assert.match(out, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com"/);
  assert.match(out, /family=Figtree/);
});

test('head가 extraHead를 그대로 이어붙인다', () => {
  const out = head({ lang: 'en', slug: 'home', seo, extraHead: '<script>1</script>' });
  assert.match(out, /<script>1<\/script>/);
});

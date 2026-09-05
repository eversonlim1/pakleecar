const test = require('node:test');
const assert = require('node:assert');
const S = require('../src/schema');

test('jsonLd가 script 태그로 감싸고 </script>를 이스케이프한다', () => {
  const out = S.jsonLd([{ a: '</script>' }]);
  assert.match(out, /<script type="application\/ld\+json">/);
  assert.doesNotMatch(out.slice(0, -9), /<\/script>/);
});

test('organization이 마스코트를 logo로 쓴다', () => {
  const o = S.organization();
  assert.strictEqual(o['@type'], 'Organization');
  assert.match(o.logo, /paklee-avatar/);
  assert.ok(o.sameAs.includes('https://www.instagram.com/paklee.carkorea/'));
});

test('touristTrip이 Offer와 통화를 담는다', () => {
  const t = S.touristTrip({
    lang: 'en', slug: 'tours/dmz', name: 'DMZ', description: 'd',
    price: '400000', duration: 'PT10H'
  });
  assert.strictEqual(t['@type'], 'TouristTrip');
  assert.strictEqual(t.offers.price, '400000');
  assert.strictEqual(t.offers.priceCurrency, 'KRW');
  assert.strictEqual(t.itinerary, undefined);
});

test('faqPage가 질문 수만큼 항목을 만든다', () => {
  const f = S.faqPage([{ q: 'a', a: 'b' }, { q: 'c', a: 'd' }]);
  assert.strictEqual(f.mainEntity.length, 2);
  assert.strictEqual(f.mainEntity[0]['@type'], 'Question');
  assert.strictEqual(f.mainEntity[0].acceptedAnswer.text, 'b');
});

test('videoObject가 embedUrl과 contentUrl을 만든다', () => {
  const v = S.videoObject(
    { id: 'ABC123', thumb: '/assets/img/reels/ABC123.jpg', duration: 'PT14S',
      uploadDate: '2026-05-27', title: { en: 'Hello' } },
    'en'
  );
  assert.strictEqual(v['@type'], 'VideoObject');
  assert.strictEqual(v.name, 'Hello');
  assert.match(v.embedUrl, /instagram\.com\/reel\/ABC123\/embed/);
  assert.match(v.thumbnailUrl, /^https:\/\//);
});

test('videoObject가 요청 lang과 en이 없으면 다른 언어값을 name으로 쓴다', () => {
  const v = S.videoObject(
    { id: 'XYZ789', thumb: '/assets/img/reels/XYZ789.jpg', duration: 'PT10S',
      uploadDate: '2026-05-27', title: { ja: 'こんにちは' } },
    'en'
  );
  assert.strictEqual(v.name, 'こんにちは');
});

test('videoObject가 title이 비어있으면 reel id를 포함한 에러를 던진다', () => {
  assert.throws(
    () => S.videoObject(
      { id: 'EMPTY001', thumb: '/x.jpg', duration: 'PT1S', uploadDate: '2026-01-01', title: {} },
      'en'
    ),
    /EMPTY001/
  );
});

test('videoObject가 요청 lang이 있으면 en보다 우선한다', () => {
  const v = S.videoObject(
    { id: 'ABC123', thumb: '/assets/img/reels/ABC123.jpg', duration: 'PT14S',
      uploadDate: '2026-05-27', title: { en: 'Hello', ja: 'こんにちは' } },
    'ja'
  );
  assert.strictEqual(v.name, 'こんにちは');
});

test('breadcrumb이 홈부터 현재 페이지까지 만든다', () => {
  const b = S.breadcrumb('en', 'tours/dmz', 'DMZ');
  assert.strictEqual(b.itemListElement.length, 2);
  assert.strictEqual(b.itemListElement[0].position, 1);
  assert.match(b.itemListElement[1].item, /\/en\/tours\/dmz\//);
});

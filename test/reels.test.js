const test = require('node:test');
const assert = require('node:assert');
const reels = require('../content/reels.json');
const { reelStrip, lightboxMarkup } = require('../templates/partials/reels');

const text = { eyebrow: 'On Instagram', h2: 'See a day', body: 'clips', all: 'See all' };

test('reels.json에 6개 릴이 있고 필수 필드를 갖춘다', () => {
  assert.strictEqual(reels.length, 6);
  for (const r of reels) {
    assert.match(r.id, /^[A-Za-z0-9_-]+$/);
    assert.match(r.thumb, /^\/assets\/img\/reels\//);
    assert.match(r.duration, /^PT\d+S$/);
    assert.match(r.uploadDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(r.title.en && r.title.id && r.title.es && r.title.ja);
  }
});

test('reelStrip이 썸네일만 넣고 iframe을 넣지 않는다', () => {
  const out = reelStrip('en', reels, text);
  assert.doesNotMatch(out, /<iframe/);
  assert.strictEqual((out.match(/data-reel=/g) || []).length, 6);
});

test('reelStrip의 모든 이미지가 lazy이고 width/height를 갖는다', () => {
  const out = reelStrip('en', reels, text);
  const imgs = out.match(/<img[^>]*>/g);
  for (const i of imgs) {
    assert.match(i, /loading="lazy"/);
    assert.match(i, /width="\d+"/);
    assert.match(i, /height="\d+"/);
  }
});

test('reelStrip이 limit을 지킨다', () => {
  const out = reelStrip('en', reels, text, { limit: 3 });
  assert.strictEqual((out.match(/data-reel=/g) || []).length, 3);
});

test('lightboxMarkup이 빈 iframe src로 시작한다', () => {
  const out = lightboxMarkup();
  assert.match(out, /<iframe id="lbFrame"/);
  assert.doesNotMatch(out, /src="https/);
});

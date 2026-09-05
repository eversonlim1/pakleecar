const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TOURS = ['tours/nami-island', 'tours/seoul-day-tour', 'tours/dmz',
  'tours/gangwon-ski', 'tours/kdrama-kpop', 'tours/everland',
  'airport-transfer', 'muslim-friendly-korea-tour'];

test('투어 8종 × 4언어가 생성된다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  for (const s of TOURS) {
    for (const l of ['id', 'en', 'es', 'ja']) {
      assert.ok(fs.existsSync(path.join(DIST, l, s, 'index.html')), `${l}/${s} 누락`);
    }
  }
});

test('투어 페이지에 TouristTrip과 FAQPage가 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'tours/dmz', 'index.html'), 'utf8');
  assert.match(h, /"@type":"TouristTrip"/);
  assert.match(h, /"@type":"FAQPage"/);
});

test('투어 페이지의 title이 서로 다르다', () => {
  const titles = TOURS.map(s => {
    const h = fs.readFileSync(path.join(DIST, 'en', s, 'index.html'), 'utf8');
    return h.match(/<title>(.*?)<\/title>/)[1];
  });
  assert.strictEqual(new Set(titles).size, TOURS.length, '중복 title 존재');
});

test('투어 페이지가 관련 투어로 내부링크한다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'tours/nami-island', 'index.html'), 'utf8');
  const internal = (h.match(/href="\/en\/(tours\/|airport-transfer|muslim-)/g) || []).length;
  assert.ok(internal >= 2, `내부링크가 ${internal}개뿐`);
});

test('투어 페이지 itinerary가 최소 4단계다', () => {
  const d = require('../content/en/tours/nami-island.json');
  assert.ok(d.itinerary.length >= 4);
  for (const st of d.itinerary) {
    assert.ok(st.time && st.title && st.body.length > 30, '단계 내용이 얇다');
  }
});

const test = require('node:test');
const assert = require('node:assert');
const { llmsTxt } = require('../src/llms');

test('llmsTxt가 사업 요약과 연락처를 담는다', () => {
  const out = llmsTxt();
  assert.match(out, /Pak Lee's Car/);
  assert.match(out, /\+82 10-9415-7859/);
  assert.match(out, /eversonlim@gmail\.com/);
});

test('llmsTxt가 절대 URL만 쓴다', () => {
  const out = llmsTxt();
  assert.doesNotMatch(out, /\]\(\//);
  assert.match(out, /https:\/\/pakleecar\.com\/en\//);
});

test('llmsTxt가 home을 제외한 모든 페이지를 나열한다', () => {
  const { PAGES } = require('../build.config');
  const out = llmsTxt();
  const nonHome = PAGES.filter(p => p.slug !== 'home');
  for (const p of nonHome) {
    assert.match(out, new RegExp(`/en/${p.slug}/`), `${p.slug} 누락`);
  }
});

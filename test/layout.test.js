const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const layout = require('../templates/layout');
const nav = require('../templates/partials/nav');
const footer = require('../templates/partials/footer');

const navText = {
  howItWorks: 'How it works', videos: 'Videos', car: 'The car',
  rates: 'Rates', shareTour: 'Shared tour', tagline: 'Private driver · Korea'
};

test('layout이 lang 속성을 올바르게 넣는다', () => {
  const out = layout({ lang: 'ja', slug: 'home', seo: { title: 'T', description: 'D' },
    schema: [], body: '<main></main>', nav: navText });
  assert.match(out, /<html lang="ja">/);
});

test('layout이 doctype으로 시작한다', () => {
  const out = layout({ lang: 'en', slug: 'home', seo: { title: 'T', description: 'D' },
    schema: [], body: '', nav: navText });
  assert.ok(out.startsWith('<!DOCTYPE html>'));
});

test('layout이 스키마를 JSON-LD로 넣는다', () => {
  const out = layout({ lang: 'en', slug: 'home', seo: { title: 'T', description: 'D' },
    schema: [{ '@type': 'Organization' }], body: '', nav: navText });
  assert.match(out, /application\/ld\+json/);
});

test('nav가 마스코트 이미지를 alt와 함께 넣는다', () => {
  const out = nav('en', navText);
  assert.match(out, /paklee-avatar/);
  assert.match(out, /alt="Pak Lee"/);
});

test('footer가 4개 언어 링크를 모두 넣는다', () => {
  const out = footer('en', navText);
  for (const l of ['id', 'en', 'es', 'ja']) {
    assert.match(out, new RegExp(`href="/${l}/"`), `${l} 링크 누락`);
  }
});

test('footer의 현재 언어 링크에 aria-current가 붙는다', () => {
  assert.match(footer('ja', navText), /href="\/ja\/" aria-current="true"/);
});

test('site.css에 footer 스타일 규칙이 존재한다', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets/css/site.css'), 'utf8');
  assert.match(css, /\.foot\{/, '.foot 규칙 누락');
  assert.match(css, /\.fl\{/, '.fl 규칙 누락');
  assert.match(css, /\.fc\{/, '.fc 규칙 누락');
  assert.match(css, /\[aria-current="true"\]/, '[aria-current="true"] 규칙 누락');
});

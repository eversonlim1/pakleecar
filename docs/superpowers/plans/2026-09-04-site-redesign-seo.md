# Pak Lee's Car 사이트 재구축 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 HTML/JS 언어토글 사이트를, 4개 언어 × 15페이지 = 60개의 정적 HTML을 생성하는 JSON 기반 빌드 시스템으로 교체한다. SEO(언어별 URL·hreflang·스키마·성능)를 1순위 기준으로 한다.

**Architecture:** `content/{lang}/*.json` (문구·메타) + `templates/*.js` (렌더 함수) → `build.js` → `dist/` 정적 HTML + `sitemap.xml`. 템플릿은 HTML 파일이 아니라 문자열을 반환하는 순수 JS 함수다. 설계 문서는 `templates/*.html`로 적었으나, 순수 함수가 단위 테스트 가능하고 부분 조합이 쉬워 JS 모듈로 구현한다. 런타임 의존성은 0이며 Vercel 정적 배포를 유지한다.

**Tech Stack:** Node 24 (설치됨), 의존성 없음. 테스트는 Node 내장 `node:test` + `node:assert`. 이미지 변환만 `sharp`를 devDependency로 추가한다.

**Spec:** `docs/superpowers/specs/2026-09-04-site-redesign-seo-design.md`

## Global Constraints

- 언어: `id`(기본 주력), `en`, `es`, `ja`. `th`는 `content/th/`에 보존하되 `LANGS`에서 제외.
- 베이스 URL은 `build.config.js`의 `SITE_URL` 상수 한 곳에서만 참조한다. 값: `https://pakleecar.vercel.app`
- 루트 `/`는 `/en/`으로 302 리다이렉트하고, hreflang `x-default`는 `/`를 가리킨다.
- 서체는 `Figtree` 하나. 세리프 금지.
- 악센트 색은 `--ac: #16A063` 하나. 헤드라인에 색을 넣지 않는다.
- h1/h2 `font-weight: 700`, `letter-spacing: -0.026em`. weight 800 금지.
- 이모지는 스티커·아이콘 칩 등 고정된 소형 자리에만. 헤드라인·버튼 금지.
- 베이지 계열 배경 금지. 중성색은 그린 틴트(`--g1`~`--g7`) 사용.
- 복잡한 사진 위에 헤드라인을 얹지 않는다. 사진은 프레임 안에 넣는다.
- 모든 `<img>`에 `width`/`height`와 의미 있는 `alt`를 넣는다. 히어로 외에는 `loading="lazy"`.
- 기존 `api/`, `admin.html`, `lib/`는 수정하지 않는다.
- 커밋 메시지는 한국어 한 줄 요약 + 본문. 매 태스크 종료 시 커밋한다.

**색 토큰 (verbatim):**
```
--ink:#16211C; --g7:#3C4A44; --g6:#5C6B64; --g5:#8B9A93;
--g3:#DCE6E1; --g2:#E9F0EC; --g1:#F3F8F5;
--ac:#16A063; --mint:#E7F5EE; --sun:#FFCE52; --peach:#FFE3D2; --coral:#FF8A5B;
```

**페이지 15종 (slug):** `home`, `share-tour`, `videos`, `tours/nami-island`, `tours/seoul-day-tour`, `tours/dmz`, `tours/gangwon-ski`, `tours/kdrama-kpop`, `tours/everland`, `airport-transfer`, `muslim-friendly-korea-tour`, `guide`, `guide/halal-food-seoul`, `guide/korea-transport-vs-private-car`, `guide/korea-itinerary-4-days`

---

## File Structure

```
build.config.js            SITE_URL, LANGS, PAGES, 상수
build.js                   엔트리. content+templates → dist/
src/
  content.js               JSON 로더, 언어 폴백, 필수 필드 검증
  seo.js                   <head> 조립: title/desc/canonical/hreflang/OG
  schema.js                JSON-LD 빌더 6종
  sitemap.js               sitemap.xml + robots.txt 생성
  html.js                  esc(), attr(), img() 유틸
templates/
  layout.js                <html> 뼈대. head + nav + main + footer
  partials/nav.js
  partials/footer.js
  partials/reels.js        릴 스트립 + 라이트박스 마크업
  partials/chat.js
  partials/rates.js
  partials/cta.js
  home.js  tour.js  guide.js  guide-hub.js  videos.js  share-tour.js
assets/
  css/site.css             디자인 시스템 (단일 파일)
  js/lightbox.js           릴 파사드 라이트박스
  img/                     원본 + 생성물
content/
  reels.json
  {id,en,es,ja}/*.json
test/
  content.test.js  seo.test.js  schema.test.js  sitemap.test.js  build.test.js
scripts/
  images.js                sharp로 AVIF/WebP 3사이즈 생성
vercel.json                루트 302, dist 배포 설정
```

---

### Task 1: 빌드 골격과 설정

**Files:**
- Create: `build.config.js`
- Create: `src/html.js`
- Create: `test/html.test.js`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: 없음
- Produces: `SITE_URL`, `LANGS`, `DEFAULT_LANG`, `PAGES`, `pageUrl(lang, slug)`, `esc(s)`, `attr(obj)`, `img(opts)`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/html.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/html.test.js`
Expected: FAIL — `Cannot find module '../src/html'`

- [ ] **Step 3: 최소 구현**

`build.config.js`:
```js
const SITE_URL = 'https://pakleecar.vercel.app';
const LANGS = ['id', 'en', 'es', 'ja'];
const DEFAULT_LANG = 'en';

const PAGES = [
  { slug: 'home',                              type: 'home',      priority: '1.0' },
  { slug: 'share-tour',                        type: 'shareTour', priority: '0.8' },
  { slug: 'videos',                            type: 'videos',    priority: '0.6' },
  { slug: 'tours/nami-island',                 type: 'tour',      priority: '0.9' },
  { slug: 'tours/seoul-day-tour',              type: 'tour',      priority: '0.9' },
  { slug: 'tours/dmz',                         type: 'tour',      priority: '0.9' },
  { slug: 'tours/gangwon-ski',                 type: 'tour',      priority: '0.8' },
  { slug: 'tours/kdrama-kpop',                 type: 'tour',      priority: '0.8' },
  { slug: 'tours/everland',                    type: 'tour',      priority: '0.8' },
  { slug: 'airport-transfer',                  type: 'tour',      priority: '0.9' },
  { slug: 'muslim-friendly-korea-tour',        type: 'tour',      priority: '0.9' },
  { slug: 'guide',                             type: 'guideHub',  priority: '0.6' },
  { slug: 'guide/halal-food-seoul',            type: 'guide',     priority: '0.7' },
  { slug: 'guide/korea-transport-vs-private-car', type: 'guide',  priority: '0.7' },
  { slug: 'guide/korea-itinerary-4-days',      type: 'guide',     priority: '0.7' }
];

function pageUrl(lang, slug) {
  return slug === 'home' ? `/${lang}/` : `/${lang}/${slug}/`;
}

module.exports = { SITE_URL, LANGS, DEFAULT_LANG, PAGES, pageUrl };
```

`src/html.js`:
```js
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ESC[c]);
}

function attr(obj) {
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === false || v === null || v === undefined) continue;
    out += v === true ? ` ${k}` : ` ${k}="${esc(v)}"`;
  }
  return out;
}

function img({ src, alt, width, height, eager = false, className = null, sizes = null }) {
  if (alt === undefined || alt === null) throw new Error(`img() requires alt: ${src}`);
  if (!width || !height) throw new Error(`img() requires width and height: ${src}`);
  return `<img${attr({
    src, alt, width, height, class: className, sizes,
    loading: eager ? false : 'lazy',
    decoding: eager ? false : 'async'
  })}>`;
}

module.exports = { esc, attr, img };
```

`package.json`의 `scripts`에 추가:
```json
"scripts": {
  "test": "node --test test/",
  "build": "node build.js",
  "images": "node scripts/images.js"
}
```

`.gitignore`에 `dist/` 추가.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 9 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add build.config.js src/html.js test/html.test.js package.json .gitignore
git commit -m "feat: 빌드 설정과 HTML 이스케이프 유틸 추가"
```

---

### Task 2: 콘텐츠 로더

**Files:**
- Create: `src/content.js`
- Create: `content/id/home.json`
- Create: `content/en/home.json`
- Create: `test/content.test.js`

**Interfaces:**
- Consumes: `build.config.js`의 `LANGS`, `DEFAULT_LANG`
- Produces: `load(lang, slug) -> object` (없는 키는 `DEFAULT_LANG`에서 폴백), `loadAll(slug) -> { [lang]: object }`, `assertSeo(obj, where)` — `seo.title`/`seo.description` 누락 시 throw

- [ ] **Step 1: 실패하는 테스트 작성**

`test/content.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/content.test.js`
Expected: FAIL — `Cannot find module '../src/content'`

- [ ] **Step 3: 최소 구현**

`src/content.js`:
```js
const fs = require('node:fs');
const path = require('node:path');
const { LANGS, DEFAULT_LANG } = require('../build.config');

const ROOT = path.join(__dirname, '..', 'content');

function readJson(lang, slug) {
  const file = path.join(ROOT, lang, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function deepMerge(base, over) {
  if (over === null || over === undefined) return base;
  if (Array.isArray(base) || typeof base !== 'object') return over;
  if (typeof over !== 'object' || Array.isArray(over)) return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
  return out;
}

function load(lang, slug) {
  const fallback = readJson(DEFAULT_LANG, slug);
  const own = readJson(lang, slug);
  if (!fallback && !own) throw new Error(`content missing: ${slug}`);
  const data = deepMerge(fallback || {}, own || {});
  assertSeo(data, `${lang}/${slug}`);
  return data;
}

function loadAll(slug) {
  const out = {};
  for (const lang of LANGS) out[lang] = load(lang, slug);
  return out;
}

function assertSeo(data, where) {
  const seo = data && data.seo;
  if (!seo || !seo.title) throw new Error(`${where}: seo.title 누락`);
  if (!seo.description) throw new Error(`${where}: seo.description 누락`);
  if (seo.title.length > 60) throw new Error(`${where}: seo.title 60자 초과 (${seo.title.length})`);
  if (seo.description.length > 160) {
    throw new Error(`${where}: seo.description 160자 초과 (${seo.description.length})`);
  }
  return true;
}

module.exports = { load, loadAll, assertSeo };
```

`content/en/home.json` (전체 홈 문구. 실제 값):
```json
{
  "seo": {
    "title": "Private Driver in Korea | Pak Lee's Car",
    "description": "A private van and driver for the whole day in Korea. No fixed route, no group. Fuel, tolls and insurance included. Message Pak Lee on WhatsApp.",
    "ogImage": "/assets/img/og/home-en.jpg"
  },
  "hero": {
    "h1": "You plan the day. I'll drive it.",
    "lede": "A private van and one driver for the whole day — no fixed route, no group to keep up with, and no rush at the places you actually like.",
    "ctaPrimary": "Message Pak Lee",
    "ctaSecondary": "See the rates",
    "sticker": "Free schedule, always",
    "bubbleTitle": "Halo! Saya Pak Lee",
    "bubbleText": "Ask me anything",
    "facts": [
      { "icon": "🚌", "value": "Up to 8", "label": "Seats, plus luggage" },
      { "icon": "⏰", "value": "10 hours", "label": "A full day out" },
      { "icon": "⛽", "value": "All in", "label": "Fuel, tolls, insurance" },
      { "icon": "💬", "value": "Within an hour", "label": "Typical reply time" }
    ]
  },
  "message": {
    "eyebrow": "How it works",
    "h2": "It starts with a message",
    "body": "No forms, and no deposit before we've spoken. Send me your dates and what you'd like to see. I'll tell you honestly what fits in a day and what doesn't.",
    "link": "Message Pak Lee",
    "chat": [
      { "from": "guest", "name": "Rina", "text": "Six of us, three kids. Nami Island on the 14th — possible?" },
      { "from": "pak", "name": "Pak Lee", "text": "Yes. Six with luggage fits fine. I'd leave at eight, before the ferry queue." },
      { "from": "guest", "name": "Rina", "text": "Halal food anywhere near there?" },
      { "from": "pak", "name": "Pak Lee", "text": "There is. I'll take you to one I eat at myself." }
    ]
  },
  "reels": {
    "eyebrow": "On Instagram",
    "h2": "See a day, before you book one",
    "body": "Short clips from real trips — guests saying hello, the places we stopped, and what the van actually looks like inside.",
    "all": "See all videos"
  },
  "car": {
    "eyebrow": "The car",
    "h2": "Hyundai Staria Lounge",
    "body": "One van, kept clean, with room to actually stretch out. Eight seats, but it's most comfortable at five or six once the luggage is in.",
    "specs": [
      { "value": "8", "label": "seats" },
      { "value": "Wi-Fi", "label": "free hotspot" },
      { "value": "USB", "label": "charging at every row" },
      { "value": "A/C", "label": "front and rear" }
    ]
  },
  "rates": {
    "eyebrow": "Rates",
    "h2": "What it costs",
    "body": "Priced per vehicle, not per person. The same price whether you're two or eight.",
    "rows": [
      { "name": "All day — Seoul", "detail": "10 hours, anywhere in the city", "price": "₩300,000", "amount": "300000" },
      { "name": "Nami Island", "detail": "10 hours, with Petite France and the garden", "price": "₩400,000", "amount": "400000" },
      { "name": "Airport pickup", "detail": "Incheon to your Seoul hotel, one way", "price": "₩150,000", "amount": "150000" },
      { "name": "Airport drop", "detail": "Seoul hotel to Incheon, one way", "price": "₩150,000", "amount": "150000" }
    ],
    "included": ["Fuel included", "Tolls included", "Insurance included"],
    "excluded": ["Parking not included", "Entry tickets not included"]
  },
  "cta": {
    "h2": "Where would you like to go?",
    "body": "Tell me your dates. If it doesn't fit in one day, I'll say so.",
    "button": "Message Pak Lee on WhatsApp"
  },
  "nav": {
    "howItWorks": "How it works",
    "videos": "Videos",
    "car": "The car",
    "rates": "Rates",
    "shareTour": "Shared tour",
    "tagline": "Private driver · Korea"
  }
}
```

`content/id/home.json` (동일 구조, 인도네시아어):
```json
{
  "seo": {
    "title": "Sewa Mobil + Sopir di Korea | Pak Lee's Car",
    "description": "Mobil pribadi dengan sopir untuk seharian penuh di Korea. Jadwal bebas, tanpa rombongan. Bensin, tol, asuransi sudah termasuk. Chat Pak Lee di WhatsApp.",
    "ogImage": "/assets/img/og/home-id.jpg"
  },
  "hero": {
    "h1": "Anda yang atur. Saya yang antar.",
    "lede": "Satu mobil dan satu sopir untuk seharian penuh — tanpa rute tetap, tanpa rombongan lain, dan tanpa buru-buru di tempat yang Anda suka.",
    "ctaPrimary": "Chat Pak Lee",
    "ctaSecondary": "Lihat harga",
    "sticker": "Jadwal bebas, selalu",
    "bubbleTitle": "Halo! Saya Pak Lee",
    "bubbleText": "Tanya apa saja",
    "facts": [
      { "icon": "🚌", "value": "Sampai 8", "label": "Kursi, plus koper" },
      { "icon": "⏰", "value": "10 jam", "label": "Seharian penuh" },
      { "icon": "⛽", "value": "Sudah termasuk", "label": "Bensin, tol, asuransi" },
      { "icon": "💬", "value": "Dalam 1 jam", "label": "Rata-rata balas" }
    ]
  },
  "message": {
    "eyebrow": "Cara kerjanya",
    "h2": "Mulai dari satu pesan",
    "body": "Tidak ada formulir, tidak ada DP sebelum kita bicara. Kirim tanggal dan tempat yang ingin Anda datangi. Saya akan bilang jujur mana yang muat dalam sehari.",
    "link": "Chat Pak Lee",
    "chat": [
      { "from": "guest", "name": "Rina", "text": "Kami berenam, tiga anak. Nami Island tanggal 14 — bisa?" },
      { "from": "pak", "name": "Pak Lee", "text": "Bisa. Enam orang dengan koper masih muat. Saya sarankan berangkat jam delapan, sebelum antrean feri." },
      { "from": "guest", "name": "Rina", "text": "Ada makanan halal di sekitar sana?" },
      { "from": "pak", "name": "Pak Lee", "text": "Ada. Saya antar ke tempat yang saya sendiri makan di situ." }
    ]
  },
  "reels": {
    "eyebrow": "Di Instagram",
    "h2": "Lihat dulu, baru pesan",
    "body": "Klip pendek dari perjalanan nyata — tamu menyapa, tempat yang kami singgahi, dan isi mobilnya seperti apa.",
    "all": "Lihat semua video"
  },
  "car": {
    "eyebrow": "Mobilnya",
    "h2": "Hyundai Staria Lounge",
    "body": "Satu mobil, selalu bersih, dengan ruang untuk selonjor. Delapan kursi, tapi paling nyaman untuk lima atau enam orang setelah koper masuk.",
    "specs": [
      { "value": "8", "label": "kursi" },
      { "value": "Wi-Fi", "label": "hotspot gratis" },
      { "value": "USB", "label": "colokan di tiap baris" },
      { "value": "AC", "label": "depan dan belakang" }
    ]
  },
  "rates": {
    "eyebrow": "Harga",
    "h2": "Berapa biayanya",
    "body": "Harga per mobil, bukan per orang. Sama saja Anda berdua atau berdelapan.",
    "rows": [
      { "name": "Seharian — Seoul", "detail": "10 jam, ke mana saja di kota", "price": "₩300.000", "amount": "300000" },
      { "name": "Nami Island", "detail": "10 jam, dengan Petite France dan taman", "price": "₩400.000", "amount": "400000" },
      { "name": "Jemput bandara", "detail": "Incheon ke hotel Seoul, sekali jalan", "price": "₩150.000", "amount": "150000" },
      { "name": "Antar bandara", "detail": "Hotel Seoul ke Incheon, sekali jalan", "price": "₩150.000", "amount": "150000" }
    ],
    "included": ["Bensin termasuk", "Tol termasuk", "Asuransi termasuk"],
    "excluded": ["Parkir tidak termasuk", "Tiket masuk tidak termasuk"]
  },
  "cta": {
    "h2": "Mau ke mana?",
    "body": "Kirim tanggalnya. Kalau tidak muat dalam sehari, saya akan bilang.",
    "button": "Chat Pak Lee via WhatsApp"
  },
  "nav": {
    "howItWorks": "Cara kerjanya",
    "videos": "Video",
    "car": "Mobilnya",
    "rates": "Harga",
    "shareTour": "Share Tour",
    "tagline": "Sopir pribadi · Korea"
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 5 tests PASS (기존 9개 포함 총 14개)

- [ ] **Step 5: 커밋**

```bash
git add src/content.js content/en/home.json content/id/home.json test/content.test.js
git commit -m "feat: JSON 콘텐츠 로더와 홈 문구(en/id) 추가"
```

---

### Task 3: SEO head 생성기

**Files:**
- Create: `src/seo.js`
- Create: `test/seo.test.js`

**Interfaces:**
- Consumes: `build.config.js`의 `SITE_URL`, `LANGS`, `DEFAULT_LANG`, `pageUrl`; `src/html.js`의 `esc`
- Produces: `head({ lang, slug, seo, extraHead })` → `<head>` 내부 문자열. `hreflangs(slug)` → `<link rel=alternate>` 묶음

- [ ] **Step 1: 실패하는 테스트 작성**

`test/seo.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/seo.test.js`
Expected: FAIL — `Cannot find module '../src/seo'`

- [ ] **Step 3: 최소 구현**

`src/seo.js`:
```js
const { SITE_URL, LANGS, pageUrl } = require('../build.config');
const { esc } = require('./html');

const OG_LOCALE = { id: 'id_ID', en: 'en_US', es: 'es_ES', ja: 'ja_JP' };

function abs(p) {
  return p.startsWith('http') ? p : SITE_URL + p;
}

function hreflangs(slug) {
  const links = LANGS.map(
    l => `<link rel="alternate" hreflang="${l}" href="${abs(pageUrl(l, slug))}">`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`);
  return links.join('\n');
}

function head({ lang, slug, seo, extraHead = '' }) {
  const url = abs(pageUrl(lang, slug));
  const ogImage = abs(seo.ogImage || '/assets/img/og/default.jpg');
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seo.title)}</title>
<meta name="description" content="${esc(seo.description)}">
<link rel="canonical" href="${url}">
${hreflangs(slug)}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pak Lee's Car">
<meta property="og:title" content="${esc(seo.title)}">
<meta property="og:description" content="${esc(seo.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
${extraHead}`;
}

module.exports = { head, hreflangs, abs };
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 8 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/seo.js test/seo.test.js
git commit -m "feat: hreflang·canonical·OG를 포함한 SEO head 생성기"
```

---

### Task 4: 구조화 데이터 빌더

**Files:**
- Create: `src/schema.js`
- Create: `test/schema.test.js`

**Interfaces:**
- Consumes: `src/seo.js`의 `abs`; `build.config.js`의 `pageUrl`
- Produces: `jsonLd(objects)` → `<script type="application/ld+json">` 문자열. 빌더: `organization()`, `localBusiness(rates)`, `breadcrumb(lang, slug, name)`, `touristTrip({lang, slug, name, description, price, duration})`, `faqPage(faqs)`, `videoObject(reel, lang)`, `article({lang, slug, headline, description, datePublished})`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/schema.test.js`:
```js
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

test('breadcrumb이 홈부터 현재 페이지까지 만든다', () => {
  const b = S.breadcrumb('en', 'tours/dmz', 'DMZ');
  assert.strictEqual(b.itemListElement.length, 2);
  assert.strictEqual(b.itemListElement[0].position, 1);
  assert.match(b.itemListElement[1].item, /\/en\/tours\/dmz\//);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/schema.test.js`
Expected: FAIL — `Cannot find module '../src/schema'`

- [ ] **Step 3: 최소 구현**

`src/schema.js`:
```js
const { pageUrl } = require('../build.config');
const { abs } = require('./seo');

const IG = 'https://www.instagram.com/paklee.carkorea/';
const PHONE = '+821094157859';

function jsonLd(objects) {
  const payload = JSON.stringify(objects.length === 1 ? objects[0] : objects)
    .replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${payload}</script>`;
}

function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Pak Lee's Car",
    url: abs('/'),
    logo: abs('/assets/img/paklee-avatar.jpg'),
    telephone: PHONE,
    sameAs: [IG]
  };
}

function localBusiness(rates) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: "Pak Lee's Car",
    url: abs('/'),
    image: abs('/assets/img/paklee-avatar.jpg'),
    telephone: PHONE,
    priceRange: '₩150,000 - ₩500,000',
    address: { '@type': 'PostalAddress', addressCountry: 'KR', addressLocality: 'Seoul' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Korea Private Car Tours',
      itemListElement: rates.map(r => ({
        '@type': 'Offer', name: r.name, price: r.amount, priceCurrency: 'KRW'
      }))
    }
  };
}

function breadcrumb(lang, slug, name) {
  const items = [{
    '@type': 'ListItem', position: 1, name: 'Home', item: abs(pageUrl(lang, 'home'))
  }];
  if (slug !== 'home') {
    items.push({
      '@type': 'ListItem', position: 2, name, item: abs(pageUrl(lang, slug))
    });
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

function touristTrip({ lang, slug, name, description, price, duration }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    url: abs(pageUrl(lang, slug)),
    provider: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') },
    ...(duration ? { subjectOf: undefined } : {}),
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: abs(pageUrl(lang, slug))
    }
  };
}

function faqPage(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
}

function videoObject(reel, lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: reel.title[lang] || reel.title.en,
    description: (reel.description && (reel.description[lang] || reel.description.en)) ||
      (reel.title[lang] || reel.title.en),
    thumbnailUrl: abs(reel.thumb),
    uploadDate: reel.uploadDate,
    duration: reel.duration,
    embedUrl: `https://www.instagram.com/reel/${reel.id}/embed/`,
    contentUrl: `https://www.instagram.com/reel/${reel.id}/`,
    publisher: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') }
  };
}

function article({ lang, slug, headline, description, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    datePublished,
    inLanguage: lang,
    mainEntityOfPage: abs(pageUrl(lang, slug)),
    author: { '@type': 'Person', name: 'Pak Lee' },
    publisher: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') }
  };
}

module.exports = {
  jsonLd, organization, localBusiness, breadcrumb,
  touristTrip, faqPage, videoObject, article
};
```

`touristTrip`의 `...(duration ? { subjectOf: undefined } : {})` 줄은 삭제하고 대신 `duration`을 쓰지 않는다 — `TouristTrip`에는 표준 duration 속성이 없다. 최종 형태:

```js
function touristTrip({ lang, slug, name, description, price }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    url: abs(pageUrl(lang, slug)),
    provider: { '@type': 'Organization', name: "Pak Lee's Car", url: abs('/') },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: abs(pageUrl(lang, slug))
    }
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 6 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/schema.js test/schema.test.js
git commit -m "feat: TouristTrip·FAQPage·VideoObject 등 스키마 빌더 6종"
```

---

### Task 5: 디자인 시스템 CSS

**Files:**
- Create: `assets/css/site.css`
- Create: `test/css.test.js`

**Interfaces:**
- Consumes: 없음
- Produces: 클래스 계약 — `.wrap .nav .brand .mascot .hero .frame .sticker .sticker2 .facts .fact .cta .btn .sec .eyebrow .chat .row .bub .clip .strip .reel .tbl .tr .chip .band .lb`

프리뷰 `.superpowers/preview/index.html`에서 검증된 스타일을 정리해 옮긴다. 프리뷰 파일은 참고용이며 커밋 대상이 아니다.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/css.test.js`:
```js
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
  assert.doesNotMatch(css, /serif(?!-)/i);
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/css.test.js`
Expected: FAIL — ENOENT `assets/css/site.css`

- [ ] **Step 3: CSS 작성**

`assets/css/site.css`를 작성한다. 구조:

1. `:root` 토큰 — Global Constraints의 색 토큰 verbatim + `--r:20px; --rl:26px; --sh:0 1px 2px rgba(16,20,24,.05)`
2. 리셋 + `body{font-family:'Figtree',system-ui,sans-serif;line-height:1.55;letter-spacing:-.005em}`
3. `.wrap{max-width:1180px;margin:0 auto;padding:0 36px}`
4. 컴포넌트: nav / hero(frame·sticker·sticker2·facts) / sec / chat / strip·reel / tbl·chip / band / lb(라이트박스)
5. 버튼: 알약 + 아래 단색 그림자
   ```css
   .cta .a{background:var(--ink);color:#fff;font-size:16px;font-weight:700;padding:17px 30px;
     border-radius:999px;box-shadow:0 6px 0 -1px rgba(22,33,28,.22);
     transition:transform .16s,box-shadow .16s}
   .cta .a:hover{transform:translateY(2px);box-shadow:0 3px 0 -1px rgba(22,33,28,.22)}
   ```
6. 장난기 레이어: `.blob`(blur 70px, opacity .13~.14), `.squiggle`(coral, stroke-width 5),
   `.reel:nth-child(odd){transform:rotate(-1.4deg)}` / `even{rotate(1.4deg)}` / `:hover{translateY(-6px) rotate(0) scale(1.02)}`
7. 반응형 `@media(max-width:920px)`: nav 링크 숨김 + 햄버거, `.hero .wrap`·`.msg .wrap`·`.car .wrap` 1열, `.strip` 2열
8. `@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important} .reel{transform:none!important}}`
9. `@media(prefers-color-scheme:dark)` — `:root:not([data-theme="light"])`에서 `--ink`를 밝게, 배경을 `#0F1512`로 스왑

**주의:** `.frame`은 `overflow:visible`이어야 스티커가 잘리지 않는다. 이미지는 내부 `.clipwrap{overflow:hidden;border-radius:30px}`으로 자른다. 프리뷰에서 이 문제로 스티커가 잘렸다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 6 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add assets/css/site.css test/css.test.js
git commit -m "feat: 디자인 시스템 CSS (Figtree, 그린 단일 악센트, 모던 캐주얼)"
```

---

### Task 6: 공통 파셜과 레이아웃

**Files:**
- Create: `templates/layout.js`
- Create: `templates/partials/nav.js`
- Create: `templates/partials/footer.js`
- Create: `templates/partials/cta.js`
- Create: `test/layout.test.js`

**Interfaces:**
- Consumes: `src/seo.js`의 `head`; `src/html.js`의 `esc`, `img`, `attr`; `build.config.js`의 `LANGS`, `pageUrl`
- Produces:
  - `layout({ lang, slug, seo, schema, body, nav })` → 완전한 HTML 문서 문자열
  - `nav(lang, navText)` → `<nav>` 문자열
  - `footer(lang, navText)` → `<footer>` 문자열 (언어 4종 링크 포함)
  - `cta(data)` → 하단 CTA 밴드 문자열

- [ ] **Step 1: 실패하는 테스트 작성**

`test/layout.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/layout.test.js`
Expected: FAIL — `Cannot find module '../templates/layout'`

- [ ] **Step 3: 최소 구현**

`templates/partials/nav.js`:
```js
const { esc } = require('../../src/html');
const { pageUrl } = require('../../build.config');

const WA = 'https://wa.me/821094157859';

module.exports = function nav(lang, t) {
  const l = s => pageUrl(lang, s);
  return `<nav class="nav"><div class="wrap">
<a class="brand" href="${l('home')}">
<img class="mascot" src="/assets/img/paklee-avatar.jpg" alt="Pak Lee" width="38" height="38">
<b>Pak Lee</b><span>${esc(t.tagline)}</span></a>
<ul>
<li><a href="${l('home')}#how">${esc(t.howItWorks)}</a></li>
<li><a href="${l('videos')}">${esc(t.videos)}</a></li>
<li><a href="${l('home')}#car">${esc(t.car)}</a></li>
<li><a href="${l('home')}#rates">${esc(t.rates)}</a></li>
<li><a href="${l('share-tour')}">${esc(t.shareTour)}</a></li>
</ul>
<div class="navr">
<a class="btn" href="${WA}" target="_blank" rel="noopener">WhatsApp</a>
</div>
</div></nav>`;
};
```

`templates/partials/footer.js`:
```js
const { esc } = require('../../src/html');
const { LANGS, pageUrl } = require('../../build.config');

const NAMES = { id: 'Bahasa Indonesia', en: 'English', es: 'Español', ja: '日本語' };

module.exports = function footer(lang, t) {
  const langs = LANGS.map(l =>
    `<a href="${pageUrl(l, 'home')}"${l === lang ? ' aria-current="true"' : ''}>${NAMES[l]}</a>`
  ).join('');
  return `<footer class="foot"><div class="wrap">
<div class="fl">${langs}</div>
<p class="fc">© ${new Date().getFullYear()} Pak Lee's Car · ${esc(t.tagline)} ·
<a href="https://www.instagram.com/paklee.carkorea/" target="_blank" rel="noopener">@paklee.carkorea</a></p>
</div></footer>`;
};
```

`templates/partials/cta.js`:
```js
const { esc } = require('../../src/html');
const WA = 'https://wa.me/821094157859';

module.exports = function cta(d) {
  return `<section class="band"><div class="wrap">
<div><h2>${esc(d.h2)}</h2><p>${esc(d.body)}</p></div>
<a class="btn" href="${WA}" target="_blank" rel="noopener">${esc(d.button)}</a>
</div></section>`;
};
```

`templates/layout.js`:
```js
const { head } = require('../src/seo');
const { jsonLd } = require('../src/schema');
const nav = require('./partials/nav');
const footer = require('./partials/footer');

module.exports = function layout({ lang, slug, seo, schema = [], body, nav: navText, bodyEnd = '' }) {
  const ld = schema.length ? jsonLd(schema) : '';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head({ lang, slug, seo, extraHead: ld })}
</head>
<body>
${nav(lang, navText)}
${body}
${footer(lang, navText)}
${bodyEnd}
</body>
</html>`;
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 6 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add templates/ test/layout.test.js
git commit -m "feat: 레이아웃과 공통 파셜(nav/footer/cta)"
```

---

### Task 7: 릴 데이터와 라이트박스

**Files:**
- Create: `content/reels.json`
- Create: `templates/partials/reels.js`
- Create: `assets/js/lightbox.js`
- Create: `test/reels.test.js`
- Copy: `.superpowers/preview/ig/*.jpg` → `assets/img/reels/`, `.superpowers/preview/ig/paklee-avatar.jpg` → `assets/img/paklee-avatar.jpg`

**Interfaces:**
- Consumes: `src/html.js`의 `esc`, `img`; `src/schema.js`의 `videoObject`
- Produces: `reelStrip(lang, reels, text, { limit })` → 섹션 문자열, `lightboxMarkup()` → 모달 마크업, `REELS` 배열(`require('../../content/reels.json')`)

- [ ] **Step 1: 실패하는 테스트 작성**

`test/reels.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/reels.test.js`
Expected: FAIL — `Cannot find module '../content/reels.json'`

- [ ] **Step 3: 최소 구현**

이미지 복사:
```bash
mkdir -p assets/img/reels
cp .superpowers/preview/ig/D*.jpg assets/img/reels/
cp .superpowers/preview/ig/paklee-avatar.jpg assets/img/paklee-avatar.jpg
```

`content/reels.json`:
```json
[
  { "id": "DciyJZzI3Rq", "thumb": "/assets/img/reels/DciyJZzI3Rq.jpg",
    "duration": "PT15S", "uploadDate": "2026-08-27",
    "title": { "en": "Wait — what's in this van?", "id": "Eh, tunggu dulu…",
               "es": "Espera, ¿qué hay en esta van?", "ja": "この車、何がある？" },
    "place": { "en": "Inside the van", "id": "Di dalam mobil",
               "es": "Dentro de la van", "ja": "車内" } },
  { "id": "DcP3w5VIoPf", "thumb": "/assets/img/reels/DcP3w5VIoPf.jpg",
    "duration": "PT18S", "uploadDate": "2026-08-19",
    "title": { "en": "We'll play your song on the way", "id": "Jaran Goyang, bareng!",
               "es": "Ponemos tu canción en el camino", "ja": "道中は好きな曲を" },
    "place": { "en": "On the road", "id": "Di jalan", "es": "En la carretera", "ja": "移動中" } },
  { "id": "DcAjNy9I9L4", "thumb": "/assets/img/reels/DcAjNy9I9L4.jpg",
    "duration": "PT20S", "uploadDate": "2026-08-13",
    "title": { "en": "Best photographer in Seoul?", "id": "Best fotografer di Seoul?",
               "es": "¿El mejor fotógrafo de Seúl?", "ja": "ソウル一の撮影係？" },
    "place": { "en": "Seoul", "id": "Seoul", "es": "Seúl", "ja": "ソウル" } },
  { "id": "Dbw32ZWoFpA", "thumb": "/assets/img/reels/Dbw32ZWoFpA.jpg",
    "duration": "PT16S", "uploadDate": "2026-08-07",
    "title": { "en": "Seoul traffic waits for no one", "id": "Jalanan Seoul nggak nunggu siapa pun",
               "es": "El tráfico de Seúl no espera", "ja": "ソウルの道は誰も待たない" },
    "place": { "en": "Seoul", "id": "Seoul", "es": "Seúl", "ja": "ソウル" } },
  { "id": "DY3AtNlolDz", "thumb": "/assets/img/reels/DY3AtNlolDz.jpg",
    "duration": "PT14S", "uploadDate": "2026-05-27",
    "title": { "en": "Thank you, Ira's family", "id": "Terima kasih, keluarga Ira",
               "es": "Gracias, familia de Ira", "ja": "イラさん家族、ありがとう" },
    "place": { "en": "Guests", "id": "Tamu", "es": "Invitados", "ja": "ゲスト" } },
  { "id": "DYoUwpto3-8", "thumb": "/assets/img/reels/DYoUwpto3-8.jpg",
    "duration": "PT22S", "uploadDate": "2026-05-21",
    "title": { "en": "A day out with Pak Lee", "id": "Sehari bareng Pak Lee",
               "es": "Un día con Pak Lee", "ja": "パクリーと一日" },
    "place": { "en": "A day out", "id": "Jalan-jalan", "es": "Un día fuera", "ja": "おでかけ" } }
]
```

`templates/partials/reels.js`:
```js
const { esc, img } = require('../../src/html');
const IG = 'https://www.instagram.com/paklee.carkorea/';

function card(r, lang) {
  const title = r.title[lang] || r.title.en;
  const place = r.place[lang] || r.place.en;
  return `<a class="reel" href="https://www.instagram.com/reel/${r.id}/" data-reel="${r.id}"
 target="_blank" rel="noopener">
${img({ src: r.thumb, alt: title, width: 360, height: 640 })}
<i class="pl" aria-hidden="true">&#9654;</i>
<div class="mt"><b>${esc(title)}</b><s>Reel · ${esc(place)}</s></div></a>`;
}

function reelStrip(lang, reels, t, { limit = 6, allHref = null } = {}) {
  const items = reels.slice(0, limit).map(r => card(r, lang)).join('\n');
  const all = allHref
    ? `<a class="ig" href="${allHref}">${esc(t.all)}</a>`
    : `<a class="ig" href="${IG}" target="_blank" rel="noopener">@paklee.carkorea</a>`;
  return `<section class="reels" id="videos"><div class="wrap">
<div class="rh">
<div><span class="eyebrow">${esc(t.eyebrow)}</span><h2>${esc(t.h2)}</h2><p class="sub">${esc(t.body)}</p></div>
${all}
</div>
<div class="strip">
${items}
</div>
</div></section>`;
}

function lightboxMarkup() {
  return `<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Instagram video">
<div class="lb-box">
<button class="lb-close" id="lbClose" aria-label="Close">&times;</button>
<iframe id="lbFrame" title="Instagram reel" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
<div class="lb-nav">
<button id="lbPrev" aria-label="Previous">&larr;</button>
<span class="ct" id="lbCount"></span>
<button id="lbNext" aria-label="Next">&rarr;</button>
</div>
</div>
</div>
<script src="/assets/js/lightbox.js" defer></script>`;
}

module.exports = { reelStrip, lightboxMarkup };
```

`assets/js/lightbox.js` — 프리뷰에서 동작 검증된 코드를 그대로 옮기되, 라이트박스가 없는 페이지에서도 안전하도록 가드를 넣는다:
```js
(function () {
  var lb = document.getElementById('lb');
  if (!lb) return;
  var fr = document.getElementById('lbFrame');
  var ct = document.getElementById('lbCount');
  var items = [].slice.call(document.querySelectorAll('[data-reel]'));
  if (!items.length) return;
  var i = 0;

  function show(n) {
    i = (n + items.length) % items.length;
    fr.src = 'https://www.instagram.com/reel/' + items[i].dataset.reel + '/embed/captioned/';
    ct.textContent = (i + 1) + ' / ' + items.length;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    fr.src = '';
    document.body.style.overflow = '';
  }
  items.forEach(function (el, n) {
    el.addEventListener('click', function (e) { e.preventDefault(); show(n); });
  });
  [].slice.call(document.querySelectorAll('[data-open]')).forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var id = el.dataset.open, n = 0;
      items.forEach(function (it, k) { if (it.dataset.reel === id) n = k; });
      show(n);
    });
  });
  document.getElementById('lbClose').onclick = close;
  document.getElementById('lbPrev').onclick = function () { show(i - 1); };
  document.getElementById('lbNext').onclick = function () { show(i + 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
})();
```

**주의:** `data-reel`은 스트립 카드에만 붙는다. 히어로 재생 버튼·대화창 첨부처럼 스트립 밖에서 여는 요소는 `data-open="<id>"`를 쓴다. 프리뷰에서 두 속성을 섞어 재생목록이 14개로 중복된 사고가 있었다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 5 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add content/reels.json templates/partials/reels.js assets/js/lightbox.js assets/img test/reels.test.js
git commit -m "feat: 인스타 릴 데이터와 파사드 라이트박스"
```

---

### Task 8: 홈 템플릿과 빌드 엔트리

**Files:**
- Create: `templates/home.js`
- Create: `templates/partials/chat.js`
- Create: `templates/partials/rates.js`
- Create: `build.js`
- Create: `test/build.test.js`

**Interfaces:**
- Consumes: Task 2~7의 전부
- Produces: `home({ lang, data, reels })` → `<main>` 문자열. `build()` → `dist/` 기록. `dist/{lang}/index.html`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/build.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

test('빌드가 성공한다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  assert.ok(fs.existsSync(DIST));
});

test('4개 언어의 홈이 생성된다', () => {
  for (const l of ['id', 'en', 'es', 'ja']) {
    assert.ok(fs.existsSync(path.join(DIST, l, 'index.html')), `${l} 홈 누락`);
  }
});

test('홈에 canonical과 5개 hreflang이 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.match(h, /rel="canonical"/);
  assert.strictEqual((h.match(/rel="alternate"/g) || []).length, 5);
});

test('홈에 LocalBusiness 스키마가 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.match(h, /"@type":"LocalBusiness"/);
});

test('홈에 iframe이 없다 (파사드 유지)', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.doesNotMatch(h, /<iframe[^>]*src="https/);
});

test('홈 HTML이 60KB 미만이다', () => {
  const size = fs.statSync(path.join(DIST, 'en', 'index.html')).size;
  assert.ok(size < 60000, `홈이 ${size} bytes로 너무 크다`);
});

test('모든 img에 width/height/alt가 있다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  for (const tag of h.match(/<img[^>]*>/g) || []) {
    assert.match(tag, /width="/, tag);
    assert.match(tag, /height="/, tag);
    assert.match(tag, /alt="/, tag);
  }
});

test('h1이 페이지당 정확히 하나다', () => {
  const h = fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8');
  assert.strictEqual((h.match(/<h1/g) || []).length, 1);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/build.test.js`
Expected: FAIL — `Cannot find module 'build.js'`

- [ ] **Step 3: 최소 구현**

`templates/partials/chat.js`:
```js
const { esc, img } = require('../../src/html');

module.exports = function chat(rows, clip) {
  const body = rows.map(r => {
    const me = r.from === 'pak';
    const who = me
      ? `<span class="who"><img src="/assets/img/paklee-avatar.jpg" alt="Pak Lee" width="34" height="34" loading="lazy" decoding="async">${esc(r.name)}</span>`
      : `<span class="who">${esc(r.name)}</span>`;
    return `<div class="row${me ? ' me' : ''}">${who}<div class="bub">${esc(r.text)}</div></div>`;
  }).join('\n');

  const attach = clip
    ? `<a class="clip" href="https://www.instagram.com/reel/${clip.id}/" data-open="${clip.id}">
<div class="th">${img({ src: clip.thumb, alt: clip.title, width: 132, height: 100 })}<i aria-hidden="true">&#9654;</i></div>
<div><b>${esc(clip.title)}</b><s>Reel · @paklee.carkorea</s></div></a>`
    : '';

  return `<div class="chat">\n${body}\n${attach}\n</div>`;
};
```

`templates/partials/rates.js`:
```js
const { esc } = require('../../src/html');

module.exports = function rates(d) {
  const rows = d.rows.map(r =>
    `<div class="tr"><b>${esc(r.name)}</b><span>${esc(r.detail)}</span><div class="pr">${esc(r.price)}</div></div>`
  ).join('\n');
  const chips = [
    ...d.included.map(c => `<span class="chip">${esc(c)}</span>`),
    ...d.excluded.map(c => `<span class="chip no">${esc(c)}</span>`)
  ].join('');
  return `<section class="rates" id="rates"><div class="wrap">
<span class="eyebrow">${esc(d.eyebrow)}</span>
<h2>${esc(d.h2)}</h2>
<p class="sub">${esc(d.body)}</p>
<div class="tbl">${rows}</div>
<div class="incl">${chips}</div>
</div></section>`;
};
```

`templates/home.js`:
```js
const { esc, img } = require('../src/html');
const { pageUrl } = require('../build.config');
const chat = require('./partials/chat');
const rates = require('./partials/rates');
const { reelStrip } = require('./partials/reels');

const WA = 'https://wa.me/821094157859';

module.exports = function home({ lang, data, reels }) {
  const h = data.hero;
  const heroReel = reels.find(r => r.id === 'DY3AtNlolDz') || reels[0];
  const heroTitle = heroReel.title[lang] || heroReel.title.en;

  const facts = h.facts.map(f =>
    `<div class="fact"><span class="ic" aria-hidden="true">${f.icon}</span>
<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div></div>`
  ).join('\n');

  return `<main>
<header class="hero">
<div class="blob a" aria-hidden="true"></div><div class="blob b" aria-hidden="true"></div>
<div class="wrap">
<div>
<h1>${esc(h.h1)}</h1>
<svg class="squiggle" viewBox="0 0 330 16" aria-hidden="true"><path d="M5 11C48 3 92 3 135 9s87 6 130-4"/></svg>
<p class="ld">${esc(h.lede)}</p>
<div class="cta"><a class="a" href="${WA}" target="_blank" rel="noopener">${esc(h.ctaPrimary)}</a>
<a class="b" href="#rates">${esc(h.ctaSecondary)}</a></div>
<div class="facts">${facts}</div>
</div>
<div class="frame">
<div class="clipwrap">${img({ src: heroReel.thumb, alt: heroTitle, width: 720, height: 900, eager: true })}</div>
<div class="sticker">${esc(h.sticker)}</div>
<div class="sticker2"><img src="/assets/img/paklee-avatar.jpg" alt="" width="40" height="40">
<span><b>${esc(h.bubbleTitle)}</b>${esc(h.bubbleText)}</span></div>
<a class="cap" href="https://www.instagram.com/reel/${heroReel.id}/" data-open="${heroReel.id}">
<i aria-hidden="true">&#9654;</i><div><b>${esc(heroTitle)}</b><s>Reel · @paklee.carkorea</s></div></a>
</div>
</div>
</header>

<section class="msg" id="how"><div class="wrap">
<div>
<span class="eyebrow">${esc(data.message.eyebrow)}</span>
<h2>${esc(data.message.h2)}</h2>
<p class="sub">${esc(data.message.body)}</p>
<a class="go" href="${WA}" target="_blank" rel="noopener">${esc(data.message.link)} &rarr;</a>
</div>
${chat(data.message.chat, { id: heroReel.id, thumb: heroReel.thumb, title: heroTitle })}
</div></section>

${reelStrip(lang, reels, data.reels, { limit: 6, allHref: pageUrl(lang, 'videos') })}

<section class="car" id="car"><div class="wrap">
<div>
<span class="eyebrow">${esc(data.car.eyebrow)}</span>
<h2>${esc(data.car.h2)}</h2>
<p class="sub">${esc(data.car.body)}</p>
<div class="specs">${data.car.specs.map(s =>
  `<div class="spec"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
</div>
<div class="gal">
${img({ src: '/assets/img/staria-ext.jpg', alt: 'Hyundai Staria Lounge exterior', width: 720, height: 960 })}
${img({ src: '/assets/img/staria-int1.jpg', alt: 'Staria Lounge interior seats', width: 720, height: 480 })}
${img({ src: '/assets/img/staria-int3.jpg', alt: 'Staria Lounge rear seats', width: 720, height: 480 })}
</div>
</div></section>

${rates(data.rates)}
</main>`;
};
```

`build.js`:
```js
const fs = require('node:fs');
const path = require('node:path');
const { LANGS, PAGES, pageUrl } = require('./build.config');
const { load } = require('./src/content');
const layout = require('./templates/layout');
const S = require('./src/schema');
const { lightboxMarkup } = require('./templates/partials/reels');
const cta = require('./templates/partials/cta');
const home = require('./templates/home');
const reels = require('./content/reels.json');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const TEMPLATES = { home };

function write(rel, contents) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function copyDir(from, to) {
  fs.cpSync(path.join(ROOT, from), path.join(DIST, to), { recursive: true });
}

function schemaFor(type, lang, slug, data) {
  const list = [S.organization(), S.breadcrumb(lang, slug, data.seo.title)];
  if (type === 'home') {
    list.push(S.localBusiness(data.rates.rows));
    for (const r of reels) list.push(S.videoObject(r, lang));
  }
  return list;
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });

  for (const page of PAGES) {
    const tpl = TEMPLATES[page.type];
    if (!tpl) continue; // 아직 구현되지 않은 페이지 타입은 건너뛴다
    for (const lang of LANGS) {
      const data = load(lang, page.slug);
      const body = tpl({ lang, data, reels }) + cta(data.cta);
      const html = layout({
        lang, slug: page.slug, seo: data.seo,
        schema: schemaFor(page.type, lang, page.slug, data),
        body, nav: data.nav, bodyEnd: lightboxMarkup()
      });
      const out = page.slug === 'home'
        ? `${lang}/index.html`
        : `${lang}/${page.slug}/index.html`;
      write(out, html);
    }
  }

  copyDir('assets', 'assets');
  console.log('built →', DIST);
}

build();
module.exports = { build };
```

기존 이미지를 `assets/img/`로 옮긴다:
```bash
mkdir -p assets/img
git mv images/staria-ext.jpg images/staria-int1.jpg images/staria-int2.jpg images/staria-int3.jpg images/hero-bg.jpg assets/img/
```

`content/{es,ja}/home.json`은 아직 없으므로 Task 2의 폴백이 en을 쓴다. Task 11에서 채운다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 8 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add build.js templates/ assets/ test/build.test.js
git commit -m "feat: 홈 템플릿과 정적 빌드 엔트리"
```

---

### Task 9: 투어 페이지 템플릿과 8개 콘텐츠

**Files:**
- Create: `templates/tour.js`
- Create: `content/en/tours/*.json` (6개), `content/en/airport-transfer.json`, `content/en/muslim-friendly-korea-tour.json`
- Create: `content/id/` 동일 8개
- Modify: `build.js` (TEMPLATES에 `tour` 등록)
- Create: `test/tour.test.js`

**Interfaces:**
- Consumes: Task 8의 전부
- Produces: `tour({ lang, data, reels })` → `<main>`. 콘텐츠 스키마: `{ seo, nav, hero{h1,lede,heroImage,heroAlt,price,duration}, itinerary[{time,title,body}], includes[], excludes[], faqs[{q,a}], related[{slug,label}], cta }`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/tour.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/tour.test.js`
Expected: FAIL — `Cannot find module '../content/en/tours/nami-island.json'`

- [ ] **Step 3: 최소 구현**

`templates/tour.js` — 홈에서 뺀 "하루의 흐름"을 여기서 본문 구조로 쓴다:
```js
const { esc, img } = require('../src/html');
const { pageUrl } = require('../build.config');
const { reelStrip } = require('./partials/reels');

const WA = 'https://wa.me/821094157859';

module.exports = function tour({ lang, data, reels }) {
  const h = data.hero;
  const steps = data.itinerary.map(s =>
    `<li class="step"><span class="t">${esc(s.time)}</span>
<b>${esc(s.title)}</b><p>${esc(s.body)}</p></li>`).join('\n');

  const chips = [
    ...data.includes.map(c => `<span class="chip">${esc(c)}</span>`),
    ...data.excludes.map(c => `<span class="chip no">${esc(c)}</span>`)
  ].join('');

  const faqs = data.faqs.map(f =>
    `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n');

  const related = data.related.map(r =>
    `<a class="rel" href="${pageUrl(lang, r.slug)}">${esc(r.label)} &rarr;</a>`).join('');

  return `<main>
<header class="thero"><div class="wrap">
<div>
<h1>${esc(h.h1)}</h1>
<p class="ld">${esc(h.lede)}</p>
<div class="tmeta"><span><b>${esc(h.price)}</b> · ${esc(h.duration)}</span></div>
<div class="cta"><a class="a" href="${WA}" target="_blank" rel="noopener">${esc(data.cta.button)}</a></div>
</div>
<div class="frame"><div class="clipwrap">
${img({ src: h.heroImage, alt: h.heroAlt, width: 720, height: 900, eager: true })}
</div></div>
</div></header>

<section class="sec day"><div class="wrap">
<h2>${esc(data.itineraryTitle)}</h2>
<ol class="steps">${steps}</ol>
<div class="incl">${chips}</div>
</div></section>

${reelStrip(lang, reels, data.reels, { limit: 3, allHref: pageUrl(lang, 'videos') })}

<section class="sec faqs"><div class="wrap">
<h2>${esc(data.faqTitle)}</h2>
${faqs}
</div></section>

<section class="sec rel"><div class="wrap">
<h2>${esc(data.relatedTitle)}</h2>
<div class="rels">${related}</div>
</div></section>
</main>`;
};
```

`build.js` 수정 — `TEMPLATES`에 tour 추가, `schemaFor`에 분기 추가:
```js
const tour = require('./templates/tour');
const TEMPLATES = { home, tour };
```
```js
  if (type === 'tour') {
    list.push(S.touristTrip({
      lang, slug, name: data.hero.h1, description: data.seo.description,
      price: data.hero.amount
    }));
    list.push(S.faqPage(data.faqs));
  }
```

`content/en/tours/nami-island.json` (나머지 7개도 같은 스키마로 작성):
```json
{
  "seo": {
    "title": "Nami Island by Private Car | Pak Lee's Car",
    "description": "A private van and driver to Nami Island, Petite France and the garden. Ten hours, your pace, fuel and tolls included. ₩400,000 per vehicle.",
    "ogImage": "/assets/img/og/nami-en.jpg"
  },
  "hero": {
    "h1": "Nami Island, at your own pace",
    "lede": "Most tours give you ninety minutes on the island. I park and wait — stay two hours or five. On the way back most people add Petite France, or Myeongdong if there's light left.",
    "heroImage": "/assets/img/reels/DY3AtNlolDz.jpg",
    "heroAlt": "Guests on a day trip with Pak Lee",
    "price": "₩400,000",
    "amount": "400000",
    "duration": "About 10 hours"
  },
  "itineraryTitle": "How the day usually runs",
  "itinerary": [
    { "time": "08:00", "title": "Your hotel",
      "body": "I text when I'm downstairs. No meeting point and no waiting in a lobby — we leave from wherever you slept." },
    { "time": "09:40", "title": "Gapyeong",
      "body": "About ninety minutes from central Seoul without traffic. Leaving at eight puts us ahead of the tour buses at the ferry pier." },
    { "time": "10:00", "title": "Nami Island",
      "body": "I park and wait at the pier. The ferry and island entry are your own ticket, about ₩16,000. Stay as long as you like — I'm not going anywhere." },
    { "time": "13:00", "title": "Lunch",
      "body": "I know which places near Gapyeong are actually halal and which only say so. If that doesn't matter to you, the dakgalbi here is worth the stop." },
    { "time": "15:00", "title": "Petite France or the Garden of Morning Calm",
      "body": "Both are fifteen minutes from the pier. Pick one on the day — you'll know by then whether you want more walking." },
    { "time": "19:30", "title": "Back — or not",
      "body": "Most people add Myeongdong on the way home. That's fine by me, as long as we're inside the ten hours." }
  ],
  "includes": ["Fuel included", "Tolls included", "Insurance included", "Driver for 10 hours"],
  "excludes": ["Ferry and island entry", "Petite France entry", "Parking", "Meals"],
  "faqTitle": "Questions people ask",
  "faqs": [
    { "q": "Can we change the plan on the day?",
      "a": "Yes. People do it constantly and it costs nothing, as long as we stay within the ten hours." },
    { "q": "Is the ferry ticket included?",
      "a": "No. The ferry and island entry are about ₩16,000 per adult and you buy them at the pier. I'll show you where." },
    { "q": "Will eight people and luggage fit?",
      "a": "Eight people fit. Eight people with large suitcases do not — at six or more I'd bring cabin bags rather than full-size cases." },
    { "q": "How long is the drive from Seoul?",
      "a": "About ninety minutes each way without traffic. Leaving at eight rather than nine usually saves half an hour." }
  ],
  "relatedTitle": "Other days out",
  "related": [
    { "slug": "tours/seoul-day-tour", "label": "A full day in Seoul" },
    { "slug": "tours/gangwon-ski", "label": "Gangwon and the ski resorts" },
    { "slug": "airport-transfer", "label": "Incheon airport pickup" }
  ],
  "reels": { "eyebrow": "On Instagram", "h2": "From real trips",
             "body": "Short clips from days like this one.", "all": "See all videos" },
  "cta": { "h2": "Thinking about Nami Island?",
           "body": "Tell me your date and how many people. I'll say honestly what else fits that day.",
           "button": "Message Pak Lee" }
}
```

나머지 7개 투어도 동일 구조로 작성한다. 각 페이지의 `itinerary`는 최소 4단계, 각 `body`는 30자 이상의 구체적 내용이어야 한다(테스트가 검사한다). 얇은 페이지 8장은 사이트 전체 평가를 깎는다.

- `tours/seoul-day-tour` — 경복궁·북촌·명동·남산, ₩300,000
- `tours/dmz` — 임진각·제3땅굴·도라전망대, 신분증 필수, ₩400,000 + 경기 할증
- `tours/gangwon-ski` — 강릉·속초·스키장, ₩400,000 + 강원 할증
- `tours/kdrama-kpop` — 촬영지·HYBE·성수, ₩300,000
- `tours/everland` — 에버랜드 왕복 + 대기, ₩350,000
- `airport-transfer` — 인천 픽업/샌드롭 편도, ₩150,000
- `muslim-friendly-korea-tour` — 할랄 식당·기도 시간·이태원 모스크, ₩300,000

`content/id/` 아래에도 8개를 인도네시아어로 작성한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 5 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add templates/tour.js content/en content/id build.js test/tour.test.js
git commit -m "feat: 투어 랜딩페이지 8종 (시간대별 코스 + FAQ 스키마)"
```

---

### Task 10: 가이드·영상·공유투어 페이지

**Files:**
- Create: `templates/guide.js`, `templates/guide-hub.js`, `templates/videos.js`, `templates/share-tour.js`
- Create: `content/{en,id}/guide.json`, `content/{en,id}/guide/*.json` (3개), `content/{en,id}/videos.json`, `content/{en,id}/share-tour.json`
- Modify: `build.js`
- Create: `test/pages.test.js`

**Interfaces:**
- Consumes: Task 9의 전부
- Produces: `guide({lang,data})`, `guideHub({lang,data})`, `videos({lang,data,reels})`, `shareTour({lang,data})`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/pages.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const read = p => fs.readFileSync(path.join(DIST, p), 'utf8');

test('15종 × 4언어 = 60개 HTML이 생성된다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  let n = 0;
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') n++;
  });
  for (const l of ['id', 'en', 'es', 'ja']) walk(path.join(DIST, l));
  assert.strictEqual(n, 60);
});

test('가이드 글에 Article 스키마가 있다', () => {
  assert.match(read('en/guide/halal-food-seoul/index.html'), /"@type":"Article"/);
});

test('가이드 글이 투어 페이지로 내부링크한다', () => {
  const h = read('en/guide/halal-food-seoul/index.html');
  assert.ok((h.match(/href="\/en\/(tours\/|muslim-)/g) || []).length >= 2);
});

test('영상 페이지에 릴 6개와 VideoObject 6개가 있다', () => {
  const h = read('en/videos/index.html');
  assert.strictEqual((h.match(/data-reel=/g) || []).length, 6);
  assert.strictEqual((h.match(/"@type":"VideoObject"/g) || []).length, 6);
});

test('공유투어 페이지가 예약 API를 호출한다', () => {
  assert.match(read('en/share-tour/index.html'), /\/api\/bookings/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/pages.test.js`
Expected: FAIL — 60개가 아님

- [ ] **Step 3: 최소 구현**

`templates/guide.js` — 본문을 블록 배열로 렌더한다. 콘텐츠 스키마 `{ seo, nav, title, intro, datePublished, blocks[{type:'h2'|'p'|'list'|'link', ...}], related[], cta }`:
```js
const { esc } = require('../src/html');
const { pageUrl } = require('../build.config');

module.exports = function guide({ lang, data }) {
  const blocks = data.blocks.map(b => {
    if (b.type === 'h2') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'p') return `<p>${esc(b.text)}</p>`;
    if (b.type === 'list') return `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    if (b.type === 'link') return `<p><a class="inl" href="${pageUrl(lang, b.slug)}">${esc(b.text)} &rarr;</a></p>`;
    throw new Error(`unknown block type: ${b.type}`);
  }).join('\n');

  const related = data.related.map(r =>
    `<a class="rel" href="${pageUrl(lang, r.slug)}">${esc(r.label)} &rarr;</a>`).join('');

  return `<main class="article"><div class="wrap">
<article>
<h1>${esc(data.title)}</h1>
<p class="ld">${esc(data.intro)}</p>
${blocks}
</article>
<div class="rels">${related}</div>
</div></main>`;
};
```

`templates/guide-hub.js` — 가이드 3편 카드 목록.
`templates/videos.js` — `reelStrip(lang, reels, data.reels, { limit: reels.length })` 를 3열 그리드로 감싼 전용 페이지.
`templates/share-tour.js` — 기존 `share-tour.html`의 캘린더·예약 폼 마크업과 스크립트를 옮긴다. `/api/bookings` 호출 경로는 그대로 유지한다. 예약 로직은 수정하지 않는다.

`build.js`의 `TEMPLATES`와 `schemaFor`를 확장:
```js
const TEMPLATES = { home, tour, guide, guideHub, videos, shareTour };
```
```js
  if (type === 'guide') {
    list.push(S.article({
      lang, slug, headline: data.title,
      description: data.seo.description, datePublished: data.datePublished
    }));
  }
  if (type === 'videos') {
    for (const r of reels) list.push(S.videoObject(r, lang));
  }
```

가이드 3편 (en/id):
- `halal-food-seoul` — 서울 할랄 식당 지역별 정리, 이태원 모스크, 편의점에서 피할 것. → `muslim-friendly-korea-tour`, `tours/seoul-day-tour` 링크
- `korea-transport-vs-private-car` — 지하철·기차·투어버스·전용차 비교, 인원별 손익분기. → `tours/nami-island`, `airport-transfer` 링크
- `korea-itinerary-4-days` — 4일 동선 예시. → 투어 3개 링크

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 5 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add templates/ content/ build.js test/pages.test.js
git commit -m "feat: 가이드·영상·공유투어 페이지"
```

---

### Task 11: 스페인어·일본어 콘텐츠

**Files:**
- Create: `content/es/**` (15개), `content/ja/**` (15개)
- Create: `content/th/home.json` (기존 `index.html`의 `data-th` 문구 이전, 빌드 제외)
- Create: `test/i18n.test.js`

**Interfaces:**
- Consumes: `content/en/**` 구조
- Produces: 없음 (데이터만)

- [ ] **Step 1: 실패하는 테스트 작성**

`test/i18n.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES, LANGS } = require('../build.config');

const C = path.join(__dirname, '..', 'content');

test('4개 언어 모두 15개 페이지 JSON을 갖는다', () => {
  for (const lang of LANGS) {
    for (const p of PAGES) {
      const f = path.join(C, lang, `${p.slug}.json`);
      assert.ok(fs.existsSync(f), `${lang}/${p.slug}.json 누락`);
    }
  }
});

test('언어별 seo.title이 영어와 동일하지 않다 (번역 누락 탐지)', () => {
  for (const lang of ['es', 'ja', 'id']) {
    for (const p of PAGES) {
      const en = require(path.join(C, 'en', `${p.slug}.json`)).seo.title;
      const t = require(path.join(C, lang, `${p.slug}.json`)).seo.title;
      assert.notStrictEqual(t, en, `${lang}/${p.slug} 번역 누락`);
    }
  }
});

test('th는 빌드 대상이 아니다', () => {
  assert.ok(!LANGS.includes('th'));
});

test('th 홈 문구가 보존돼 있다', () => {
  assert.ok(fs.existsSync(path.join(C, 'th', 'home.json')));
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/i18n.test.js`
Expected: FAIL — `es/home.json 누락`

- [ ] **Step 3: 콘텐츠 작성**

`content/en/**`의 15개 파일을 `es/`, `ja/`로 번역한다.

번역 규칙:
- 기계적 직역 금지. 1인칭 화자(Pak Lee)의 말투를 유지한다.
- `seo.title` 60자 이하, `seo.description` 160자 이하 (Task 2의 `assertSeo`가 빌드를 실패시킨다).
- 일본어는 자연스러운 경어체(です・ます)를 쓰되 과공손하지 않게.
- 스페인어는 중남미·스페인 양쪽에 통하는 중립 표현을 쓰고, 2인칭은 `usted`가 아닌 `tú`로 캐주얼하게.
- 가격·전화번호·릴 ID 등 고유값은 번역하지 않는다.
- 릴 캡션은 `content/reels.json`의 `title`/`place`에 이미 4개 언어가 들어 있다.

`content/th/home.json`은 기존 `index.html`의 `data-th` 속성 값을 옮겨 보존한다. `LANGS`에 없으므로 빌드되지 않는다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 4 tests PASS. `npm run build` 후 `dist/es/`, `dist/ja/`에 15개씩 생성 확인.

- [ ] **Step 5: 커밋**

```bash
git add content/es content/ja content/th test/i18n.test.js
git commit -m "feat: 스페인어·일본어 콘텐츠 15페이지, 태국어 보존"
```

---

### Task 12: sitemap·robots·루트 리다이렉트

**Files:**
- Create: `src/sitemap.js`
- Create: `vercel.json`
- Modify: `build.js`
- Create: `test/sitemap.test.js`

**Interfaces:**
- Consumes: `build.config.js`의 `SITE_URL`, `LANGS`, `PAGES`, `pageUrl`
- Produces: `sitemapXml()` → 문자열, `robotsTxt()` → 문자열

- [ ] **Step 1: 실패하는 테스트 작성**

`test/sitemap.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { sitemapXml, robotsTxt } = require('../src/sitemap');

test('sitemap에 60개 url이 있다', () => {
  const x = sitemapXml();
  assert.strictEqual((x.match(/<url>/g) || []).length, 60);
});

test('각 url이 5개 hreflang 대체링크를 갖는다', () => {
  const x = sitemapXml();
  assert.strictEqual((x.match(/xhtml:link/g) || []).length, 60 * 5);
});

test('sitemap이 절대 URL만 쓴다', () => {
  const x = sitemapXml();
  assert.doesNotMatch(x, /<loc>\//);
});

test('robots가 sitemap을 가리킨다', () => {
  assert.match(robotsTxt(), /Sitemap: https:\/\/pakleecar\.vercel\.app\/sitemap\.xml/);
});

test('빌드가 sitemap.xml과 robots.txt를 dist에 쓴다', () => {
  const ROOT = path.join(__dirname, '..');
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(ROOT, 'dist', 'sitemap.xml')));
  assert.ok(fs.existsSync(path.join(ROOT, 'dist', 'robots.txt')));
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/sitemap.test.js`
Expected: FAIL — `Cannot find module '../src/sitemap'`

- [ ] **Step 3: 최소 구현**

`src/sitemap.js`:
```js
const { SITE_URL, LANGS, PAGES, pageUrl } = require('../build.config');

function abs(p) { return SITE_URL + p; }

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const alts = LANGS
        .map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(pageUrl(l, page.slug))}"/>`)
        .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/"/>`)
        .join('');
      urls.push(`<url><loc>${abs(pageUrl(lang, page.slug))}</loc>` +
        `<lastmod>${today}</lastmod><priority>${page.priority}</priority>${alts}</url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

function robotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

module.exports = { sitemapXml, robotsTxt };
```

`build.js`의 `build()` 끝에 추가:
```js
  const { sitemapXml, robotsTxt } = require('./src/sitemap');
  write('sitemap.xml', sitemapXml());
  write('robots.txt', robotsTxt());
```

`vercel.json`:
```json
{
  "cleanUrls": true,
  "trailingSlash": true,
  "redirects": [
    { "source": "/", "destination": "/en/", "permanent": false }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

**주의:** Vercel 프로젝트의 Output Directory를 `dist`로, Build Command를 `npm run build`로 설정해야 한다. 배포 후 실제 URL로 확인할 것.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 5 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/sitemap.js vercel.json build.js test/sitemap.test.js
git commit -m "feat: sitemap.xml, robots.txt, 루트 언어 리다이렉트"
```

---

### Task 13: 이미지 최적화 파이프라인

**Files:**
- Create: `scripts/images.js`
- Modify: `src/html.js` (`picture()` 추가)
- Modify: `templates/*.js` (히어로·갤러리·릴 썸네일을 `picture()`로 교체)
- Modify: `package.json` (`sharp` devDependency)
- Create: `test/images.test.js`

**Interfaces:**
- Consumes: `assets/img/**` 원본
- Produces: `assets/img/opt/<name>-<w>.avif|webp|jpg` (w ∈ 480, 960, 1440), `picture({src, alt, width, height, sizes, eager})` → `<picture>` 문자열

- [ ] **Step 1: 실패하는 테스트 작성**

`test/images.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { picture } = require('../src/html');

test('picture가 avif·webp·jpg 순서로 소스를 낸다', () => {
  const out = picture({ src: '/assets/img/staria-ext.jpg', alt: '차', width: 720, height: 960 });
  const avif = out.indexOf('image/avif');
  const webp = out.indexOf('image/webp');
  assert.ok(avif > -1 && webp > -1 && avif < webp);
  assert.match(out, /<img[^>]*src="[^"]*\.jpg"/);
});

test('picture가 3개 폭의 srcset을 만든다', () => {
  const out = picture({ src: '/assets/img/staria-ext.jpg', alt: '차', width: 720, height: 960 });
  for (const w of [480, 960, 1440]) assert.match(out, new RegExp(`-${w}\\.avif ${w}w`));
});

test('생성된 최적화 이미지가 원본보다 작다', () => {
  const orig = path.join(__dirname, '..', 'assets/img/staria-ext.jpg');
  const opt = path.join(__dirname, '..', 'assets/img/opt/staria-ext-960.avif');
  if (!fs.existsSync(opt)) { console.log('skip: npm run images 미실행'); return; }
  assert.ok(fs.statSync(opt).size < fs.statSync(orig).size);
});

test('원본 이미지가 1.5MB를 넘지 않는다', () => {
  const dir = path.join(__dirname, '..', 'assets/img');
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(jpg|png)$/i.test(f)) continue;
    const size = fs.statSync(path.join(dir, f)).size;
    assert.ok(size < 1_500_000, `${f}가 ${size} bytes`);
  }
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/images.test.js`
Expected: FAIL — `picture is not a function`

- [ ] **Step 3: 최소 구현**

```bash
npm install --save-dev sharp
```

`scripts/images.js`:
```js
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'assets', 'img');
const OUT = path.join(SRC, 'opt');
const WIDTHS = [480, 960, 1440];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  for (const file of files) {
    const name = path.parse(file).name;
    const input = path.join(SRC, file);
    const meta = await sharp(input).metadata();
    for (const w of WIDTHS) {
      if (meta.width && meta.width < w) continue;
      const base = sharp(input).resize({ width: w, withoutEnlargement: true });
      await base.clone().avif({ quality: 55 }).toFile(path.join(OUT, `${name}-${w}.avif`));
      await base.clone().webp({ quality: 72 }).toFile(path.join(OUT, `${name}-${w}.webp`));
      await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, `${name}-${w}.jpg`));
    }
    console.log('optimised', file);
  }
}
main();
```

`src/html.js`에 추가:
```js
const WIDTHS = [480, 960, 1440];

function picture({ src, alt, width, height, sizes = '100vw', eager = false, className = null }) {
  if (alt === undefined || alt === null) throw new Error(`picture() requires alt: ${src}`);
  const dir = src.replace(/\/[^/]+$/, '') + '/opt';
  const name = src.split('/').pop().replace(/\.[^.]+$/, '');
  const set = ext => WIDTHS.map(w => `${dir}/${name}-${w}.${ext} ${w}w`).join(', ');
  return `<picture>
<source type="image/avif" srcset="${set('avif')}" sizes="${esc(sizes)}">
<source type="image/webp" srcset="${set('webp')}" sizes="${esc(sizes)}">
${img({ src: `${dir}/${name}-960.jpg`, alt, width, height, eager, className })}
</picture>`;
}
```
`module.exports`에 `picture` 추가.

템플릿 교체: `templates/home.js`의 히어로·갤러리, `templates/tour.js`의 히어로에서 `img(...)` → `picture(...)`. 릴 썸네일(`templates/partials/reels.js`)은 360px 고정이라 `img` 그대로 둔다. 단 `test/build.test.js`의 "모든 img에 width/height/alt" 테스트가 `<picture>` 내부 `<img>`에도 적용되므로 통과해야 한다.

원본 대용량 이미지(`staria-ext.jpg` 2MB 등)는 `npm run images` 실행 후 원본을 1440px jpeg로 다운스케일해 교체한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run images && npm test`
Expected: 4 tests PASS, 기존 테스트 전부 PASS

- [ ] **Step 5: 커밋**

```bash
git add scripts/images.js src/html.js templates/ package.json package-lock.json assets/img test/images.test.js
git commit -m "feat: AVIF/WebP 3사이즈 이미지 파이프라인"
```

---

### Task 14: 구 파일 정리와 최종 검증

**Files:**
- Delete: `index.html`, `templates.html`
- Modify: `share-tour.html` → `templates/share-tour.js`로 이전 완료 후 삭제
- Create: `test/regression.test.js`
- Modify: `README.md` (신규)

**Interfaces:**
- Consumes: 전체
- Produces: 없음

- [ ] **Step 1: 실패하는 테스트 작성**

`test/regression.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function allHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) allHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

test('루트에 구 index.html이 남아있지 않다', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'index.html')));
});

test('어떤 페이지에도 data-id/data-en 속성이 없다', () => {
  execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'pipe' });
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(h, /data-(id|en|th)="/, f);
  }
});

test('모든 페이지가 canonical과 정확히 1개의 h1을 갖는다', () => {
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    assert.match(h, /rel="canonical"/, f);
    assert.strictEqual((h.match(/<h1[\s>]/g) || []).length, 1, f);
  }
});

test('내부 링크가 모두 실제 파일로 해석된다', () => {
  const missing = [];
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const href = m[1];
      if (href.startsWith('/api/') || href.startsWith('/assets/')) continue;
      const target = path.join(DIST, href, 'index.html');
      if (!fs.existsSync(target) && !fs.existsSync(path.join(DIST, href))) {
        missing.push(`${path.relative(DIST, f)} → ${href}`);
      }
    }
  }
  assert.deepStrictEqual(missing, []);
});

test('모든 페이지에 JSON-LD가 있고 파싱된다', () => {
  for (const f of allHtml(DIST)) {
    const h = fs.readFileSync(f, 'utf8');
    const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, `${f}: JSON-LD 없음`);
    assert.doesNotThrow(() => JSON.parse(m[1].replace(/\\u003c/g, '<')), f);
  }
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test test/regression.test.js`
Expected: FAIL — 루트 `index.html`이 아직 존재

- [ ] **Step 3: 정리**

```bash
git rm index.html templates.html share-tour.html
git rm -r images
```

`README.md` 작성 — 빌드 방법, 문구 수정 위치, 언어 추가 방법, 릴 추가 방법, 태국어 활성화 방법(`build.config.js`의 `LANGS`에 `'th'` 추가), Vercel 설정(Output Directory `dist`).

`.gitignore`에 `dist/`, `assets/img/opt/`가 있는지 확인한다. `opt/`는 빌드 산출물이므로 커밋하지 않고 `npm run images`로 재생성한다. 단 Vercel 빌드에서 `npm run build` 전에 `npm run images`가 실행되도록 `package.json`의 `build` 스크립트를 `node scripts/images.js && node build.js`로 바꾼다.

- [ ] **Step 4: 전체 검증**

```bash
npm test
npm run build
npx serve dist   # 또는 python -m http.server 8899 -d dist
```

브라우저에서 확인:
1. `/en/`, `/id/`, `/es/`, `/ja/` 홈이 모두 열린다
2. 릴 클릭 → 라이트박스 재생, Prev/Next 동작, ESC 닫힘
3. 언어 전환 링크가 같은 페이지의 다른 언어로 간다
4. 창을 375px로 줄여 모바일 레이아웃 확인
5. DevTools Lighthouse(모바일) 실행 → 성능 90+, LCP 2.5s 이하 확인
6. `https://search.google.com/test/rich-results`에 `/en/tours/dmz/` HTML 붙여넣어 TouristTrip·FAQPage 인식 확인

Expected: 전체 테스트 PASS, Lighthouse 성능 90+

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "refactor: 구 단일 HTML 제거, README와 최종 회귀 테스트 추가"
```

---

## Self-Review

**1. 스펙 커버리지**

| 스펙 항목 | 태스크 |
|---|---|
| 4언어 × 15페이지 = 60 URL | 8, 9, 10, 11 |
| hreflang + x-default | 3, 12 |
| 루트 302 리다이렉트 | 12 |
| JSON 기반 빌드 시스템 | 1, 2, 8 |
| 태국어 보존, 빌드 제외 | 1(LANGS), 11 |
| 디자인 시스템 (Figtree·그린 단일 악센트) | 5 |
| 마스코트 브랜드 마크 | 6(nav), 7(자산), 8(히어로) |
| 릴 파사드 + 라이트박스 | 7 |
| 릴 다국어 한 줄 설명 | 7(reels.json title/place) |
| 팔로워 수 비노출 | 어느 템플릿에도 없음 (7, 10) |
| 스키마 6종 | 4, 8, 9, 10 |
| 이미지 AVIF/WebP 3사이즈 | 13 |
| LCP·CLS 목표 | 13, 14(Step 4) |
| 내부링크 설계 | 9(related), 10(guide→tour), 6(footer 언어) |
| api/·admin.html 미수정 | 10(share-tour 이전 시 경로 유지), 14 |
| 도메인 상수 1곳 | 1(SITE_URL) |

누락 없음.

**2. 플레이스홀더 스캔**

Task 9의 투어 7종과 Task 11의 번역은 개별 문구를 전부 적지 않고 스키마·규칙·주제만 명시했다. 이는 분량 문제이며 구조는 Task 9의 `nami-island.json` 전문이 완전한 예시로 제공된다. 실행자는 그 파일을 형틀로 삼는다. Task 10의 `guide-hub.js`/`videos.js`/`share-tour.js`도 마찬가지로 `guide.js` 전문이 형틀이다.

**3. 타입 일관성**

- `pageUrl(lang, slug)` — Task 1 정의, 3·6·9·10·12에서 동일 시그니처 사용 ✓
- `abs(p)` — Task 3에서 정의하고 export, Task 4가 `require('./seo')`로 소비 ✓
- `img({src, alt, width, height, eager, className, sizes})` — Task 1 정의, 7·8·9에서 동일 ✓
- `picture(...)` — Task 13에서 `img`와 같은 인자 구조로 추가 ✓
- `reelStrip(lang, reels, t, {limit, allHref})` — Task 7 정의, 8·9·10에서 동일 ✓
- `data-reel`(스트립 전용) vs `data-open`(외부 트리거) 구분 — Task 7에 명시, 8에서 준수 ✓
- `S.touristTrip`은 `duration`을 받지 않는다 — Task 4에서 최종형 확정, Task 9의 호출부가 `price`만 전달 ✓

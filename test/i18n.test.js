const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES } = require('../build.config');
const { assertSeo } = require('../src/content');

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const SLUGS = PAGES.map(p => p.slug);

const read = (lang, slug) =>
  JSON.parse(fs.readFileSync(path.join(CONTENT, lang, `${slug}.json`), 'utf8'));

function shape(v, prefix = '') {
  if (v === null || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap((x, i) => shape(x, `${prefix}[${i}]`));
  return Object.keys(v).flatMap(k => [`${prefix}.${k}`, ...shape(v[k], `${prefix}.${k}`)]);
}

for (const lang of ['es', 'ja', 'th']) {
  test(`${lang}: 15종 콘텐츠 파일이 모두 존재한다`, () => {
    for (const slug of SLUGS) {
      const f = path.join(CONTENT, lang, `${slug}.json`);
      assert.ok(fs.existsSync(f), `${lang}/${slug}.json 누락`);
    }
  });

  test(`${lang}: 키 구조가 en과 완전히 같다`, () => {
    for (const slug of SLUGS) {
      assert.deepStrictEqual(
        shape(read(lang, slug)).sort(),
        shape(read('en', slug)).sort(),
        `${lang}/${slug} 키 구조 불일치`
      );
    }
  });

  test(`${lang}: seo title 60자 / description 160자 이내다`, () => {
    for (const slug of SLUGS) assertSeo(read(lang, slug), `${lang}/${slug}`);
  });

  test(`${lang}: 번역이 영어 원문 그대로가 아니다`, () => {
    for (const slug of SLUGS) {
      assert.notStrictEqual(
        read(lang, slug).seo.title,
        read('en', slug).seo.title,
        `${lang}/${slug} seo.title이 영어와 동일`
      );
    }
  });
}

for (const lang of ['id', 'en', 'es', 'ja', 'th']) {
  for (const type of ['tour', 'guide']) {
    test(`${lang}: ${type} 페이지 seo.title이 서로 다르다`, () => {
      const slugs = PAGES.filter(p => p.type === type).map(p => p.slug);
      const titles = slugs.map(s => read(lang, s).seo.title);
      assert.strictEqual(new Set(titles).size, slugs.length, `${lang}/${type} 중복 title`);
    });
  }
}

test('th는 이제 빌드 대상이다', () => {
  const { LANGS } = require('../build.config');
  assert.ok(LANGS.includes('th'), 'th가 LANGS에 있어야 한다');
});

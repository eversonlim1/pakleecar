const fs = require('node:fs');
const path = require('node:path');
const { LANGS, PAGES, pageUrl } = require('./build.config');
const { load } = require('./src/content');
const layout = require('./templates/layout');
const S = require('./src/schema');
const { lightboxMarkup } = require('./templates/partials/reels');
const cta = require('./templates/partials/cta');
const home = require('./templates/home');
const tour = require('./templates/tour');
const reels = require('./content/reels.json');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const TEMPLATES = { home, tour };

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
  if (type === 'tour') {
    list.push(S.touristTrip({
      lang, slug, name: data.hero.h1, description: data.seo.description,
      price: data.hero.amount
    }));
    list.push(S.faqPage(data.faqs));
  }
  return list;
}

function clean(dir) {
  // Remove the directory's contents but not the directory node itself —
  // some Windows/exFAT setups intermittently EBUSY/EPERM on rmdir of a
  // just-emptied top-level directory, even though clearing its children
  // works fine.
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

function build() {
  clean(DIST);

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

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { LANGS, PAGES, pageUrl } = require('./build.config');
const { load } = require('./src/content');
const layout = require('./templates/layout');
const S = require('./src/schema');
const { lightboxMarkup } = require('./templates/partials/reels');
const cta = require('./templates/partials/cta');
const home = require('./templates/home');
const tour = require('./templates/tour');
const guide = require('./templates/guide');
const guideHub = require('./templates/guide-hub');
const videos = require('./templates/videos');
const shareTour = require('./templates/share-tour');
const reels = require('./content/reels.json');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const TEMPLATES = { home, tour, guide, guideHub, videos, shareTour };

function write(rel, contents) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function copyDir(from, to) {
  fs.cpSync(path.join(ROOT, from), path.join(DIST, to), { recursive: true });
}

// vercel.json caches everything under /assets/ for a year with `immutable`,
// which only stays correct if a content change also changes the URL.
// These filenames carry a content hash so a deploy that edits site.css,
// nav.js or lightbox.js is never served stale from a CDN/browser cache —
// the plain (unhashed) filename stays too, only as a legacy fallback.
function hashedAssetName(relPath) {
  const buf = fs.readFileSync(path.join(ROOT, relPath));
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const { dir, name, ext } = path.parse(relPath);
  const hashedRel = path.join(dir, `${name}.${hash}${ext}`);
  return { hash, href: '/' + hashedRel.split(path.sep).join('/') };
}

function copyHashed(relPath) {
  const { href } = hashedAssetName(relPath);
  const dest = path.join(DIST, href);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, relPath), dest);
  return href;
}

function schemaFor(type, lang, slug, data) {
  const list = [S.organization(), S.breadcrumb(lang, slug, data.seo.title)];
  if (type === 'home') {
    list.push(S.localBusiness(data.rates.rows));
    list.push(S.faqPage(data.faq.items));
    for (const r of reels) list.push(S.videoObject(r, lang));
  }
  if (type === 'tour') {
    list.push(S.touristTrip({
      lang, slug, name: data.hero.h1, description: data.seo.description,
      price: data.hero.amount
    }));
    list.push(S.faqPage(data.faqs));
  }
  if (type === 'guide') {
    list.push(S.article({
      lang, slug, headline: data.title,
      description: data.seo.description, datePublished: data.datePublished
    }));
  }
  if (type === 'videos') {
    for (const r of reels) list.push(S.videoObject(r, lang));
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

  const cssHref = copyHashed('assets/css/site.css');
  const navJsHref = copyHashed('assets/js/nav.js');
  const lightboxJsHref = copyHashed('assets/js/lightbox.js');

  for (const page of PAGES) {
    const tpl = TEMPLATES[page.type];
    if (!tpl) continue; // 아직 구현되지 않은 페이지 타입은 건너뛴다
    for (const lang of LANGS) {
      const data = load(lang, page.slug);
      const body = tpl({ lang, data, reels }) + cta(data.cta);
      const html = layout({
        lang, slug: page.slug, seo: data.seo,
        schema: schemaFor(page.type, lang, page.slug, data),
        body, nav: data.nav, bodyEnd: lightboxMarkup(lightboxJsHref),
        cssHref, navJsHref
      });
      const out = page.slug === 'home'
        ? `${lang}/index.html`
        : `${lang}/${page.slug}/index.html`;
      write(out, html);
    }
  }

  copyDir('assets', 'assets');

  const { sitemapXml, robotsTxt } = require('./src/sitemap');
  write('sitemap.xml', sitemapXml());
  write('robots.txt', robotsTxt());

  const { llmsTxt } = require('./src/llms');
  write('llms.txt', llmsTxt());

  console.log('built →', DIST);
}

build();
module.exports = { build };

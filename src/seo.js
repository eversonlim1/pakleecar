const { SITE_URL, LANGS, pageUrl } = require('../build.config');
const { esc } = require('./html');

const OG_LOCALE = { id: 'id_ID', en: 'en_US', es: 'es_ES', ja: 'ja_JP' };

function abs(p) {
  return /^https?:\/\//.test(p) ? p : SITE_URL + p;
}

function hreflangs(slug) {
  const links = LANGS.map(
    l => `<link rel="alternate" hreflang="${l}" href="${abs(pageUrl(l, slug))}">`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${abs('/')}">`);
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

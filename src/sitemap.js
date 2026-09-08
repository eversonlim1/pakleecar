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

const { esc, img } = require('../src/html');
const { pageUrl } = require('../build.config');

module.exports = function guideHub({ lang, data }) {
  const cards = data.articles.map(a => `<a class="gcard" href="${pageUrl(lang, a.slug)}">
${img({ src: a.image, alt: a.imageAlt, width: 480, height: 320 })}
<div class="gcard-body"><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p></div>
</a>`).join('\n');

  return `<main class="article"><div class="wrap">
<h1>${esc(data.title)}</h1>
<p class="ld">${esc(data.intro)}</p>
<div class="gcards">${cards}</div>
</div></main>`;
};

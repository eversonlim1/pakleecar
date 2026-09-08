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

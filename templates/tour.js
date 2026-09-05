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

<section class="day"><div class="wrap">
<h2>${esc(data.itineraryTitle)}</h2>
<ol class="steps">${steps}</ol>
<div class="incl">${chips}</div>
</div></section>

${reelStrip(lang, reels, data.reels, { limit: 3, allHref: pageUrl(lang, 'videos') })}

<section class="faqs"><div class="wrap">
<h2>${esc(data.faqTitle)}</h2>
${faqs}
</div></section>

<section class="rels-sec"><div class="wrap">
<h2>${esc(data.relatedTitle)}</h2>
<div class="rels">${related}</div>
</div></section>
</main>`;
};

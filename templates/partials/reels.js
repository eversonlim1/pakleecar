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

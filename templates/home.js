const { esc, picture } = require('../src/html');

function twoLineHeadline(text) {
  const m = text.match(/^(.+?[.。])\s*(.*)$/s);
  if (!m || !m[2]) return esc(text);
  return `${esc(m[1])}<br><span class="accent">${esc(m[2])}</span>`;
}
const { pageUrl } = require('../build.config');
const chat = require('./partials/chat');
const rates = require('./partials/rates');
const { reelStrip } = require('./partials/reels');

const WA = 'https://wa.me/821094157859';

module.exports = function home({ lang, data, reels }) {
  const h = data.hero;
  const heroReel = reels.find(r => r.id === 'DY3AtNlolDz') || reels[0];
  const heroTitle = heroReel.title[lang] || heroReel.title.en;

  const quadFacts = h.facts.map(f =>
    `<li><b>${esc(f.value)}</b><span>${esc(f.label)}</span></li>`
  ).join('\n');

  const SPEC_ICONS = ['\u{1F465}', '\u{1F4F6}', '\u{1F50C}', '❄️'];
  const specs = data.car.specs.map((s, i) =>
    `<li><span class="ic" aria-hidden="true">${SPEC_ICONS[i] || '•'}</span><span class="lb">${esc(s.label)}</span><b>${esc(s.value)}</b></li>`
  ).join('\n');

  return `<main class="home">
<header class="hero"><div class="hgrid">

<div class="hcell hcell-a">
<span class="kicker">${esc(h.sticker)}</span>
<h1>${twoLineHeadline(h.h1)}</h1>
<a class="htrust" href="https://www.instagram.com/paklee.carkorea/" target="_blank" rel="noopener">
<img src="/assets/img/paklee-avatar.jpg" alt="" width="32" height="32">
<div><b>Real trips, real guests</b><span>@paklee.carkorea</span></div>
</a>
</div>

<div class="hcell hcell-b">
<div class="hclip">${picture({ src: heroReel.thumb, alt: heroTitle, width: 720, height: 900, eager: true })}</div>
</div>

<div class="hcell hcell-c">
<p class="ld">${esc(h.lede)}</p>
<a class="hgo" href="${WA}" target="_blank" rel="noopener"><span>${esc(h.ctaPrimary)}</span><i aria-hidden="true">&rarr;</i></a>
</div>

<div class="hcell hcell-d">
<ul class="quad-facts">${quadFacts}</ul>
</div>

</div></header>

<section class="msg" id="how"><div class="wrap">
<div>
<span class="eyebrow">${esc(data.message.eyebrow)}</span>
<h2>${esc(data.message.h2)}</h2>
<p class="sub">${esc(data.message.body)}</p>
<a class="go" href="${WA}" target="_blank" rel="noopener">${esc(data.message.link)} &rarr;</a>
</div>
<div class="phone">
<div class="phone-head"><img src="/assets/img/paklee-avatar.jpg" alt="" width="30" height="30"><b>Pak Lee</b><i class="dot" aria-hidden="true"></i></div>
${chat(data.message.chat, { id: heroReel.id, thumb: heroReel.thumb, title: heroTitle })}
</div>
</div></section>

<section class="quote"><div class="wrap">
<span class="qmark" aria-hidden="true">&#8220;</span>
<div class="qbody">
<p>${esc(data.quote.text)}</p>
<div class="qwho"><img src="/assets/img/paklee-avatar.jpg" alt="" width="40" height="40">
<div><b>Pak Lee</b><span>${esc(data.nav.tagline)}</span></div></div>
</div>
<span class="quote-tag">${esc(h.sticker)}</span>
</div></section>

${reelStrip(lang, reels, data.reels, { limit: 6, allHref: pageUrl(lang, 'videos') })}

<section class="car" id="car"><div class="wrap">
<div class="car-head">
<span class="eyebrow">${esc(data.car.eyebrow)}</span>
<h2>${esc(data.car.h2)}</h2>
<p class="sub">${esc(data.car.body)}</p>
</div>
<div class="car-row">
<div class="gal">
${picture({ src: '/assets/img/staria-ext.jpg', alt: 'Hyundai Staria Lounge exterior', width: 720, height: 480 })}
${picture({ src: '/assets/img/staria-int3.jpg', alt: 'Staria Lounge rear seats', width: 720, height: 480 })}
</div>
<ul class="specs">${specs}</ul>
</div>
</div></section>

${rates(data.rates)}

<section class="faqs" id="faq"><div class="wrap">
<span class="eyebrow">${esc(data.faq.eyebrow)}</span>
<h2>${esc(data.faq.h2)}</h2>
${data.faq.items.map(f =>
  `<details class="faq"><summary>${esc(f.q)}</summary><div class="faq-a"><img src="/assets/img/paklee-avatar.jpg" alt="" width="28" height="28"><p>${esc(f.a)}</p></div></details>`).join('\n')}
</div></section>
</main>`;
};

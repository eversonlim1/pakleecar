const { esc, picture } = require('../src/html');

function twoLineHeadline(text) {
  const m = text.match(/^(.+?[.。])\s*(.*)$/s);
  if (!m || !m[2]) return esc(text);
  return `${esc(m[1])}<br>${esc(m[2])}`;
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

  const facts = h.facts.map(f =>
    `<div class="fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`
  ).join('\n');

  return `<main>
<header class="hero">
<div class="wrap">
<div>
<h1>${twoLineHeadline(h.h1)}</h1>
<p class="ld">${esc(h.lede)}</p>
<div class="cta"><a class="a" href="${WA}" target="_blank" rel="noopener">${esc(h.ctaPrimary)}</a>
<a class="b" href="#rates">${esc(h.ctaSecondary)}</a></div>
<div class="facts">${facts}</div>
</div>
<div class="frame">
<div class="clipwrap">${picture({ src: heroReel.thumb, alt: heroTitle, width: 720, height: 900, eager: true })}</div>
<a class="cap" href="https://www.instagram.com/reel/${heroReel.id}/" data-open="${heroReel.id}">
<i aria-hidden="true">&#9654;</i><div><b>${esc(heroTitle)}</b><s>Reel · @paklee.carkorea</s></div></a>
</div>
</div>
</header>

<section class="msg" id="how"><div class="wrap">
<div>
<span class="eyebrow">${esc(data.message.eyebrow)}</span>
<h2>${esc(data.message.h2)}</h2>
<p class="sub">${esc(data.message.body)}</p>
<a class="go" href="${WA}" target="_blank" rel="noopener">${esc(data.message.link)} &rarr;</a>
</div>
${chat(data.message.chat, { id: heroReel.id, thumb: heroReel.thumb, title: heroTitle })}
</div></section>

${reelStrip(lang, reels, data.reels, { limit: 6, allHref: pageUrl(lang, 'videos') })}

<section class="car" id="car"><div class="wrap">
<div>
<span class="eyebrow">${esc(data.car.eyebrow)}</span>
<h2>${esc(data.car.h2)}</h2>
<p class="sub">${esc(data.car.body)}</p>
<div class="specs">${data.car.specs.map(s =>
  `<div class="spec"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
</div>
<div class="gal">
${picture({ src: '/assets/img/staria-ext.jpg', alt: 'Hyundai Staria Lounge exterior', width: 720, height: 960 })}
${picture({ src: '/assets/img/staria-int1.jpg', alt: 'Staria Lounge interior seats', width: 720, height: 480 })}
${picture({ src: '/assets/img/staria-int3.jpg', alt: 'Staria Lounge rear seats', width: 720, height: 480 })}
</div>
</div></section>

<section class="quote"><div class="wrap">
<svg class="qmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14.4C0 6.4 4.8 1.2 12.8 0l1.6 3.2c-4.8 1.6-7.2 4.8-7.2 8.8h6.4V24H0Zm17.6 0V14.4c0-8 4.8-13.2 12.8-14.4L32 3.2c-4.8 1.6-7.2 4.8-7.2 8.8H32V24H17.6Z"/></svg>
<p>${esc(data.quote.text)}</p>
<div class="qwho"><img src="/assets/img/paklee-avatar.jpg" alt="" width="36" height="36">Pak Lee</div>
</div></section>

${rates(data.rates)}

<section class="faqs" id="faq"><div class="wrap">
<span class="eyebrow">${esc(data.faq.eyebrow)}</span>
<h2>${esc(data.faq.h2)}</h2>
${data.faq.items.map(f =>
  `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}
</div></section>
</main>`;
};

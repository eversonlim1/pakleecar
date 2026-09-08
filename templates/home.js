const { esc, picture } = require('../src/html');
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
    `<div class="fact"><span class="ic" aria-hidden="true">${f.icon}</span>
<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div></div>`
  ).join('\n');

  return `<main>
<header class="hero">
<div class="blob a" aria-hidden="true"></div><div class="blob b" aria-hidden="true"></div>
<div class="wrap">
<div>
<h1>${esc(h.h1)}</h1>
<svg class="squiggle" viewBox="0 0 330 16" aria-hidden="true"><path d="M5 11C48 3 92 3 135 9s87 6 130-4"/></svg>
<p class="ld">${esc(h.lede)}</p>
<div class="cta"><a class="a" href="${WA}" target="_blank" rel="noopener">${esc(h.ctaPrimary)}</a>
<a class="b" href="#rates">${esc(h.ctaSecondary)}</a></div>
<div class="facts">${facts}</div>
</div>
<div class="frame">
<div class="clipwrap">${picture({ src: heroReel.thumb, alt: heroTitle, width: 720, height: 900, eager: true })}</div>
<div class="sticker">${esc(h.sticker)}</div>
<div class="sticker2"><img src="/assets/img/paklee-avatar.jpg" alt="" width="40" height="40">
<span><b>${esc(h.bubbleTitle)}</b>${esc(h.bubbleText)}</span></div>
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

${rates(data.rates)}
</main>`;
};

const { esc, picture } = require('../src/html');
const { pageUrl } = require('../build.config');
const chat = require('./partials/chat');
const { reelStrip } = require('./partials/reels');

const WA = 'https://wa.me/821094157859';
const EN_IG = 'https://www.instagram.com/mr.lee_private_car_in_korea/';
const SPEC_ICONS = ['\u{1F465}', '\u{1F4F6}', '\u{1F50C}', '\u{1F4A7}', '\u{1FA79}'];

function twoLineHeadline(text) {
  const m = text.match(/^(.+?[.。])\s*(.*)$/s);
  if (!m || !m[2]) return esc(text);
  return `${esc(m[1])}<br>${esc(m[2])}`;
}

const accent = '<span class="h-accent" aria-hidden="true">Pak Lee</span>';

function block(num, title, body, inner) {
  return `<div class="h-block">
<span class="h-num">${num}</span>
<h3>${esc(title)}</h3>
${body ? `<p class="h-bsub">${esc(body)}</p>` : ''}
${inner}
</div>`;
}

module.exports = function home({ lang, data, reels }) {
  const h = data.hero;
  const heroReel = reels.find(r => r.id === 'DY3AtNlolDz') || reels[0];
  const heroTitle = heroReel.title[lang] || heroReel.title.en;
  const r = data.rates;

  const corners = [
    { src: '/assets/img/staria-ext2.jpg', alt: 'Hyundai Staria Lounge private van', w: 480, h: 320, cls: 'tl' },
    { src: '/assets/img/reels/DcAjNy9I9L4.jpg', alt: 'Pak Lee taking photos for guests in Seoul', w: 360, h: 440, cls: 'tr' },
    { src: '/assets/img/reels/DcP3w5VIoPf.jpg', alt: 'Pak Lee at the wheel, thumbs up', w: 360, h: 440, cls: 'bl' },
    { src: heroReel.thumb, alt: heroTitle, w: 480, h: 340, cls: 'br' }
  ].map(p => `<div class="h-ph h-ph-${p.cls}">${picture({ src: p.src, alt: p.alt, width: p.w, height: p.h, eager: true })}</div>`).join('\n');

  const badges = h.facts.map(f =>
    `<li><span class="h-bic" aria-hidden="true">${esc(f.icon)}</span><b>${esc(f.value)}</b><span>${esc(f.label)}</span></li>`
  ).join('\n');

  const specs = data.car.specs.map((s, i) =>
    `<li><span class="h-tic" aria-hidden="true">${SPEC_ICONS[i] || '•'}</span><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`
  ).join('\n');

  const prices = r.rows.map(row =>
    `<div class="h-price"><b>${esc(row.name)}</b><span>${esc(row.detail)}</span><strong>${esc(row.price)}</strong></div>`
  ).join('\n');

  const chips = [
    ...r.included.map(c => `<li class="yes">${esc(c)}</li>`),
    ...r.excluded.map(c => `<li class="no">${esc(c)}</li>`)
  ].join('');

  const extra = r.extra ? `<div class="h-yellow">
<b class="h-ylabel">${esc(r.extra.label)}</b>
<ul>${r.extra.items.map(x => `<li><span>${esc(x.name)}</span><b>${esc(x.price)}</b></li>`).join('')}</ul>
</div>` : '';

  const faqs = data.faq.items.map(f =>
    `<details class="h-faq"><summary><i aria-hidden="true">Q</i>${esc(f.q)}</summary><div class="h-faq-a"><img src="/assets/img/paklee-avatar.jpg" alt="" width="28" height="28"><p>${esc(f.a)}</p></div></details>`
  ).join('\n');

  return `<main class="home">
<header class="h-hero">
${corners}
<div class="wrap h-hero-in">
<p class="h-teaser">${esc(h.lede)}</p>
<p class="h-sub">${esc(h.vanTag)}</p>
<h1>${twoLineHeadline(h.h1)}</h1>
<div class="h-btns">
<a class="pbtn pbtn-or" href="${WA}" target="_blank" rel="noopener">${esc(h.ctaPrimary)} &rsaquo;</a>
<a class="pbtn" href="#rates">${esc(h.ctaSecondary)} &rsaquo;</a>
${lang === 'en'
  ? `<a class="pbtn" href="${EN_IG}" target="_blank" rel="noopener">&#9654; ${esc(h.watch)}</a>`
  : `<a class="pbtn" href="https://www.instagram.com/reel/${heroReel.id}/" data-open="${heroReel.id}">&#9654; ${esc(h.watch)}</a>`}
</div>
</div>
</header>

<section class="h-band"><div class="wrap"><ul class="h-badges">${badges}</ul></div></section>

<section class="h-green" id="how"><div class="wrap">
<div class="h-head">${accent}<h2>${esc(data.message.h2)}</h2><p>${esc(data.message.body)}</p></div>
<div class="h-card h-talk">
<div class="phone">
<div class="phone-head"><img src="/assets/img/paklee-avatar.jpg" alt="" width="30" height="30"><b>Pak Lee</b><i class="dot" aria-hidden="true"></i></div>
${chat(data.message.chat, lang === 'en'
  ? { thumb: heroReel.thumb, title: heroTitle, igProfile: EN_IG, handle: '@mr.lee_private_car_in_korea' }
  : { id: heroReel.id, thumb: heroReel.thumb, title: heroTitle })}
</div>
<div class="h-talk-tx">
<blockquote>&ldquo;${esc(data.quote.text)}&rdquo;</blockquote>
<div class="h-who"><img src="/assets/img/paklee-avatar.jpg" alt="" width="40" height="40"><div><b>Pak Lee</b><span>${esc(data.nav.tagline)}</span></div></div>
<div class="h-talk-btns">
<a class="pbtn pbtn-or" href="${WA}" target="_blank" rel="noopener">${esc(data.message.link)} &rsaquo;</a>
<a class="pbtn" href="mailto:pakleecar@gmail.com">&#9993; ${esc(data.message.email)}</a>
</div>
</div>
</div>
<div class="h-card h-reels">
${reelStrip(lang, reels, data.reels, { limit: 6, allHref: pageUrl(lang, 'videos'), igProfile: lang === 'en' ? EN_IG : null })}
</div>
</div></section>

<section class="h-gray"><div class="wrap">
<div class="h-head">${accent}<h2>&ldquo;${esc(data.why.h2)}&rdquo;</h2></div>

<div id="car" class="car">
${block('01', data.car.h2, data.car.body, `<div class="gal">
${picture({ src: '/assets/img/staria-ext2.jpg', alt: 'Hyundai Staria Lounge, three-quarter view', width: 720, height: 480 })}
${picture({ src: '/assets/img/staria-int3.jpg', alt: 'Staria Lounge rear seats', width: 480, height: 480 })}
${picture({ src: '/assets/img/staria-int2.jpg', alt: 'Staria Lounge sunroof and full row of seats', width: 480, height: 480 })}
${picture({ src: '/assets/img/staria-ext.jpg', alt: 'Hyundai Staria Lounge, front view', width: 480, height: 480 })}
${picture({ src: '/assets/img/staria-int1.jpg', alt: 'Staria Lounge interior, front row', width: 480, height: 480 })}
</div>
<ul class="h-tiles">${specs}</ul>`)}
</div>

<div id="rates">
${block('02', r.h2, r.body, `<div class="h-prices">${prices}</div>
<ul class="h-incl">${chips}</ul>
${extra}`)}
</div>

<div id="faq">
${block('03', data.faq.h2, '', `<div class="h-faqs">${faqs}</div>`)}
</div>
</div></section>

<nav class="h-quick" aria-label="Quick menu">
<a class="q-wa" href="${WA}" target="_blank" rel="noopener">${esc(h.ctaPrimary)} &rarr;</a>
<a href="#rates">${esc(data.nav.rates)} &rarr;</a>
<a href="#faq">${esc(data.faq.eyebrow)} &rarr;</a>
<a class="q-top" href="#">TOP &uarr;</a>
</nav>
</main>`;
};

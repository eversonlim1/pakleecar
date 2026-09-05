const { esc } = require('../../src/html');
const { pageUrl } = require('../../build.config');

const WA = 'https://wa.me/821094157859';

module.exports = function nav(lang, t) {
  const l = s => pageUrl(lang, s);
  const links = [
    { href: `${l('home')}#how`, text: t.howItWorks },
    { href: l('videos'), text: t.videos },
    { href: `${l('home')}#car`, text: t.car },
    { href: `${l('home')}#rates`, text: t.rates },
    { href: l('share-tour'), text: t.shareTour }
  ];
  const desktopLinks = links.map(
    x => `<li><a href="${x.href}">${esc(x.text)}</a></li>`
  ).join('\n');
  const mobileLinks = links.map(
    x => `<li><a href="${x.href}">${esc(x.text)}</a></li>`
  ).join('\n');

  return `<nav class="nav"><div class="wrap">
<a class="brand" href="${l('home')}">
<img class="mascot" src="/assets/img/paklee-avatar.jpg" alt="Pak Lee" width="38" height="38">
<b>Pak Lee</b><span>${esc(t.tagline)}</span></a>
<ul>
${desktopLinks}
</ul>
<div class="navr">
<a class="btn" href="${WA}" target="_blank" rel="noopener">WhatsApp</a>
<button type="button" class="hamburger" aria-label="Menu" aria-controls="mobile-menu" aria-expanded="false">
<span></span>
</button>
</div>
</div></nav>
<div class="mobile-menu" id="mobile-menu">
<div class="mm-top">
<a class="brand" href="${l('home')}">
<img class="mascot" src="/assets/img/paklee-avatar.jpg" alt="Pak Lee" width="38" height="38">
<b>Pak Lee</b></a>
<button type="button" class="mm-close" aria-label="Close menu">&times;</button>
</div>
<ul>
${mobileLinks}
</ul>
<a class="btn" href="${WA}" target="_blank" rel="noopener">WhatsApp</a>
</div>`;
};

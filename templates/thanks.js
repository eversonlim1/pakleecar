const { esc } = require('../src/html');
const { pageUrl } = require('../build.config');
const { GA_TAG, abs } = require('../src/seo');
const { jsonLd, organization } = require('../src/schema');

// One language-neutral /thanks/ page, so Google Ads needs a single
// conversion URL. It renders in English, and the script swaps in the copy
// for ?l=<lang> (sent by the booking form), then the browser language.
module.exports = function thanks({ all, cssHref }) {
  const en = all.en;
  const copy = Object.fromEntries(Object.entries(all).map(([l, d]) => [l, {
    title: d.seo.title, h1: d.h1, body: d.body, again: d.again, home: d.home, homeHref: pageUrl(l, 'home')
  }]));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${GA_TAG}
<title>${esc(en.seo.title)}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${abs('/thanks/')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssHref}">
${jsonLd([organization()])}
</head>
<body class="bk">
<main class="bk"><div class="wrap bk-wrap bk-done">
<a class="brand bk-brand" href="/"><img src="/assets/img/paklee-avatar.jpg" alt="Pak Lee" width="38" height="38" class="mascot"><b>Pak Lee</b></a>
<div class="bk-check" aria-hidden="true">&#10003;</div>
<h1 id="tH1">${esc(en.h1)}</h1>
<p class="bk-lede" id="tBody">${esc(en.body)}</p>
<a class="pbtn pbtn-or" id="tAgain" href="https://wa.me/821094157859" target="_blank" rel="noopener">${esc(en.again)}</a>
<a class="bk-home" id="tHome" href="${pageUrl('en', 'home')}">${esc(en.home)} &rarr;</a>
</div></main>
<script>
(function () {
  var copy = ${JSON.stringify(copy).replace(/</g, '\\u003c')};
  var q = (location.search.match(/[?&]l=([a-z]{2})/) || [])[1];
  var nav = (navigator.language || '').slice(0, 2).toLowerCase();
  var c = copy[q] || copy[nav] || copy.en;
  var lang = copy[q] ? q : copy[nav] ? nav : 'en';
  document.documentElement.lang = lang;
  document.title = c.title;
  document.getElementById('tH1').textContent = c.h1;
  document.getElementById('tBody').textContent = c.body;
  var again = document.getElementById('tAgain');
  again.textContent = c.again;
  var home = document.getElementById('tHome');
  home.textContent = c.home + ' \\u2192';
  home.href = c.homeHref;
  try { var wa = sessionStorage.getItem('plWa'); if (wa) again.href = wa; } catch (x) {}
})();
</script>
</body>
</html>`;
};

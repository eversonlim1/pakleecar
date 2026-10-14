const { esc } = require('../src/html');
const { pageUrl } = require('../build.config');
const { GA_TAG, abs } = require('../src/seo');
const { jsonLd, organization } = require('../src/schema');

// One language-neutral /thanks/ page, so Google Ads needs a single
// conversion URL. It renders in English, and the script swaps in the copy
// for ?l=<lang> (sent by the booking form), then the browser language.
// Languages whose guests use LINE instead of WhatsApp (see book.js).
const LINE = { ja: 'https://line.me/ti/p/6hxug19MGH', th: 'https://line.me/ti/p/6hxug19MGH' };

module.exports = function thanks({ all, cssHref }) {
  const en = all.en;
  const copy = Object.fromEntries(Object.entries(all).map(([l, d]) => [l, {
    title: d.seo.title, h1: d.h1, body: d.body, again: d.again, askWa: d.askWa, copy: d.copy, copied: d.copied, line: LINE[l] || null, home: d.home, homeHref: pageUrl(l, 'home')
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
<div class="bk-sum" id="tSum" hidden><pre id="tSumTx"></pre><button type="button" class="bk-copy" id="tCopy"></button></div>
<a class="pbtn pbtn-or" id="tAgain" href="https://wa.me/821094157859" target="_blank" rel="noopener">${esc(en.again)}</a>
<a class="pbtn bk-wa" id="tAsk" href="https://wa.me/821094157859" target="_blank" rel="noopener"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 1 2.4 10.3 10.3 0 0 0 4 3.5c1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z"/></svg><span id="tAskTx">${esc(en.askWa)}</span></a>
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
  document.getElementById('tAskTx').textContent = c.askWa;
  var home = document.getElementById('tHome');
  home.textContent = c.home + ' \\u2192';
  home.href = c.homeHref;
  var wa = null, sum = null;
  try { wa = sessionStorage.getItem('plWa'); sum = sessionStorage.getItem('plSummary'); } catch (x) {}
  if (c.line) {
    // LINE can't take a prefilled message: show the request to copy, and
    // point both buttons at Pak Lee's LINE.
    again.href = c.line;
    var ask = document.getElementById('tAsk');
    ask.href = c.line;
    ask.classList.add('bk-line');
    ask.querySelector('svg').innerHTML = '<path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.3 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8Z"/>';
    if (sum) {
      document.getElementById('tSum').hidden = false;
      document.getElementById('tSumTx').textContent = sum;
      var copyBtn = document.getElementById('tCopy');
      copyBtn.textContent = c.copy;
      copyBtn.addEventListener('click', function () {
        var done = function () { copyBtn.textContent = c.copied; };
        if (navigator.clipboard) navigator.clipboard.writeText(sum).then(done, done);
        else { var t = document.createElement('textarea'); t.value = sum; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (x) {} t.remove(); done(); }
      });
    }
  } else if (wa) {
    again.href = wa;
  }
})();
</script>
</body>
</html>`;
};

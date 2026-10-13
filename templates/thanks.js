const { esc } = require('../src/html');
const { pageUrl } = require('../build.config');

module.exports = function thanks({ lang, data }) {
  return `<main class="bk"><div class="wrap bk-wrap bk-done">
<div class="bk-check" aria-hidden="true">&#10003;</div>
<h1>${esc(data.h1)}</h1>
<p class="bk-lede">${esc(data.body)}</p>
<a class="pbtn pbtn-or" id="bkAgain" href="https://wa.me/821094157859" target="_blank" rel="noopener">${esc(data.again)}</a>
<a class="bk-home" href="${pageUrl(lang, 'home')}">${esc(data.home)} &rarr;</a>
</div></main>
<script>
(function () {
  try {
    var url = sessionStorage.getItem('plWa');
    if (url) document.getElementById('bkAgain').href = url;
  } catch (x) {}
})();
</script>`;
};

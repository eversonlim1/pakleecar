const { esc } = require('../../src/html');
const { LANGS, pageUrl } = require('../../build.config');

const NAMES = { id: 'Bahasa Indonesia', en: 'English', es: 'Español', ja: '日本語' };

module.exports = function footer(lang, t) {
  const langs = LANGS.map(l =>
    `<a href="${pageUrl(l, 'home')}"${l === lang ? ' aria-current="true"' : ''}>${NAMES[l]}</a>`
  ).join('');
  return `<footer class="foot"><div class="wrap">
<div class="fl">${langs}</div>
<p class="fc">© ${new Date().getFullYear()} Pak Lee's Car · ${esc(t.tagline)} ·
<a href="https://www.instagram.com/paklee.carkorea/" target="_blank" rel="noopener">@paklee.carkorea</a></p>
</div></footer>`;
};

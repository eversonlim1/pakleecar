const { esc } = require('../../src/html');
const { LANGS, pageUrl } = require('../../build.config');

const NAMES = { id: 'Bahasa Indonesia', en: 'English', es: 'Español', ja: '日本語', th: 'ภาษาไทย' };

module.exports = function footer(lang, t) {
  const langs = LANGS.map(l =>
    `<a href="${pageUrl(l, 'home')}"${l === lang ? ' aria-current="true"' : ''}>${NAMES[l]}</a>`
  ).join('');
  return `<footer class="foot"><div class="wrap">
<div class="fl">${langs}</div>
<p class="fc">© ${new Date().getFullYear()} Pak Lee's Car · ${esc(t.tagline)} ·
${lang === 'id'
  ? '<a href="https://www.instagram.com/paklee.carkorea/" target="_blank" rel="noopener">@paklee.carkorea</a>'
  : lang === 'th'
  ? '<a href="https://www.instagram.com/pakleecar_th/" target="_blank" rel="noopener">@pakleecar_th</a>'
  : '<a href="https://www.instagram.com/mr.lee_private_car_in_korea/" target="_blank" rel="noopener">@mr.lee_private_car_in_korea</a>'}</p>
</div></footer>`;
};

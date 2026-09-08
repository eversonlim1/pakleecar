const { esc } = require('../src/html');
const { reelStrip } = require('./partials/reels');

module.exports = function videos({ lang, data, reels }) {
  return `<main class="vpage"><div class="wrap vhead">
<h1>${esc(data.title)}</h1>
<p class="ld">${esc(data.intro)}</p>
</div>
${reelStrip(lang, reels, data.reels, { limit: reels.length })}
</main>`;
};

const { esc } = require('../../src/html');
const WA = 'https://wa.me/821094157859';

module.exports = function cta(d) {
  return `<section class="band"><div class="wrap">
<div><h2>${esc(d.h2)}</h2><p>${esc(d.body)}</p></div>
<a class="btn" href="${WA}" target="_blank" rel="noopener">${esc(d.button)}</a>
</div></section>`;
};

const { esc } = require('../../src/html');
const WA = 'https://wa.me/821094157859';

module.exports = function cta(d) {
  const email = d.email
    ? `<a class="email" href="mailto:eversonlim@gmail.com">${esc(d.email)}</a>`
    : '';
  return `<section class="band"><div class="wrap">
<div><h2>${esc(d.h2)}</h2><p>${esc(d.body)}</p></div>
<div class="actions">
<a class="btn" href="${WA}" target="_blank" rel="noopener">${esc(d.button)}</a>
${email}
</div>
</div></section>`;
};

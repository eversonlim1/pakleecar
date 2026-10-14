const { esc } = require('../../src/html');
const { contact } = require('../../src/contact');

module.exports = function cta(d, lang) {
  const email = d.email
    ? `<a class="email" href="mailto:pakleecar@gmail.com">${esc(d.email)}</a>`
    : '';
  return `<section class="band"><div class="wrap">
<div><h2>${esc(d.h2)}</h2><p>${esc(d.body)}</p></div>
<div class="actions">
<a class="btn" href="${contact(lang).url}" target="_blank" rel="noopener">${esc(d.button)}</a>
${email}
</div>
</div></section>`;
};

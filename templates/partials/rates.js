const { esc } = require('../../src/html');

module.exports = function rates(d) {
  const rows = d.rows.map(r =>
    `<div class="tr"><b>${esc(r.name)}</b><span>${esc(r.detail)}</span><div class="pr">${esc(r.price)}</div></div>`
  ).join('\n');
  const chips = [
    ...d.included.map(c => `<span class="chip">${esc(c)}</span>`),
    ...d.excluded.map(c => `<span class="chip no">${esc(c)}</span>`)
  ].join('');
  return `<section class="rates" id="rates"><div class="wrap">
<span class="eyebrow">${esc(d.eyebrow)}</span>
<h2>${esc(d.h2)}</h2>
<p class="sub">${esc(d.body)}</p>
<div class="tbl">${rows}</div>
<div class="incl">${chips}</div>
</div></section>`;
};

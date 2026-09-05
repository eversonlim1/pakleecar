const { esc, img } = require('../../src/html');

module.exports = function chat(rows, clip) {
  const body = rows.map(r => {
    const me = r.from === 'pak';
    const who = me
      ? `<span class="who"><img src="/assets/img/paklee-avatar.jpg" alt="Pak Lee" width="34" height="34" loading="lazy" decoding="async">${esc(r.name)}</span>`
      : `<span class="who">${esc(r.name)}</span>`;
    return `<div class="row${me ? ' me' : ''}">${who}<div class="bub">${esc(r.text)}</div></div>`;
  }).join('\n');

  const attach = clip
    ? `<a class="clip" href="https://www.instagram.com/reel/${clip.id}/" data-open="${clip.id}">
<div class="th">${img({ src: clip.thumb, alt: clip.title, width: 132, height: 100 })}<i aria-hidden="true">&#9654;</i></div>
<div><b>${esc(clip.title)}</b><s>Reel · @paklee.carkorea</s></div></a>`
    : '';

  return `<div class="chat">\n${body}\n${attach}\n</div>`;
};

const { esc } = require('../src/html');

const WA_NUMBER = '821094157859';
// Japanese and Thai visitors rarely use WhatsApp, so those pages hand off to Pak
// Lee's personal LINE instead. LINE links can't carry a prefilled message,
// so the summary is shown on /thanks/ for the guest to copy and paste.
const LINE = { ja: 'https://line.me/ti/p/6hxug19MGH', th: 'https://line.me/ti/p/6hxug19MGH' };
const WA_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 1 2.4 10.3 10.3 0 0 0 4 3.5c1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z"/></svg>`;
const LINE_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.3 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8Z"/></svg>`;
const LOCALE = { en: 'en-US', id: 'id-ID', es: 'es-ES', ja: 'ja-JP', th: 'th-TH' };

// Pak Lee reads English, so the WhatsApp message uses these English labels
// whatever language the form is shown in. price null = he quotes it.
const CHOICES = {
  pickup:  { en: 'Airport pickup', price: 150000 },
  drop:    { en: 'Airport drop-off', price: 150000 },
  seoul:   { en: '10-hour day hire - within Seoul', price: 300000 },
  nami:    { en: '10-hour day hire - Nami Island', price: 400000 },
  vivaldi: { en: '10-hour day hire - Vivaldi Park', price: 400000 },
  sokcho:  { en: '10-hour day hire - Sokcho', price: 450000 },
  other:   { en: '10-hour day hire - other destination', price: null }
};

function js(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function chips(name, items) {
  return `<div class="bk-chips" role="radiogroup">${items.map(([value, label]) =>
    `<label class="bk-chip"><input type="radio" name="${name}" value="${value}"><span>${esc(label)}</span></label>`
  ).join('')}</div>`;
}

module.exports = function book({ lang, data }) {
  const line = LINE[lang];
  const askHref = line || `https://wa.me/${WA_NUMBER}`;
  const people = Array.from({ length: 8 }, (_, i) =>
    `<option value="${i + 1}"${i === 1 ? ' selected' : ''}>${i + 1}</option>`).join('');

  return `<main class="bk"><div class="wrap bk-wrap">
<h1>${esc(data.h1)}</h1>
<p class="bk-lede">${esc(data.lede)}</p>
<form class="bk-form" id="bkForm" novalidate>
<label>${esc(data.name)}<input name="name" type="text" autocomplete="name" required></label>
<div class="bk-row">
<label>${esc(data.date)}<input name="date" type="date" required></label>
<label>${esc(data.people)}<select name="people">${people}</select></label>
</div>

<fieldset class="bk-step"><legend>${esc(data.service)}</legend>
${chips('service', [['day', data.svcDay], ['airport', data.svcAirport]])}
</fieldset>

<fieldset class="bk-step" data-show="airport" hidden><legend>${esc(data.airportQ)}</legend>
${chips('airport', [['pickup', data.pickup], ['drop', data.drop]])}
</fieldset>

<fieldset class="bk-step" data-show="day" hidden><legend>${esc(data.areaQ)}</legend>
${chips('area', [['seoul', data.inSeoul], ['out', data.outSeoul]])}
</fieldset>

<fieldset class="bk-step" data-show="out" hidden><legend>${esc(data.destQ)}</legend>
${chips('dest', [['nami', data.nami], ['vivaldi', data.vivaldi], ['sokcho', data.sokcho], ['other', data.other]])}
</fieldset>

<div class="bk-row" data-show="other" hidden>
<label>${esc(data.from)}<input name="from" type="text"></label>
<label>${esc(data.to)}<input name="to" type="text"></label>
</div>

<div class="bk-price" id="bkPrice" hidden>
<span>${esc(data.price)}</span>
<b id="bkPriceVal"></b>
<small>${esc(data.priceNote)}</small>
</div>

<label>${esc(data.hotel)}<input name="hotel" type="text"></label>
<label>${esc(data.message)}<textarea name="message" rows="3"></textarea></label>
<p class="bk-err" id="bkErr" role="alert" hidden>${esc(data.required)}</p>
<button class="pbtn pbtn-or bk-submit" type="submit">${esc(data.submit)}</button>
<p class="bk-note">${esc(data.note)}</p>
</form>
<p class="bk-or"><span>${esc(data.or)}</span></p>
<a class="pbtn bk-wa${line ? ' bk-line' : ''}" href="${askHref}" target="_blank" rel="noopener">${line ? LINE_ICON : WA_ICON}${esc(data.askWa)}</a>
</div></main>
<script>
(function () {
  var form = document.getElementById('bkForm');
  var err = document.getElementById('bkErr');
  var priceBox = document.getElementById('bkPrice');
  var priceVal = document.getElementById('bkPriceVal');
  var choices = ${js(CHOICES)};
  var quote = ${js(data.quote)};
  var thanks = ${js('/thanks/?l=' + lang)};
  var useLine = ${line ? 'true' : 'false'};
  var fmt = new Intl.NumberFormat(${js(LOCALE[lang] || 'en-US')});
  var d = new Date();
  form.date.min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  // Which final choice the visitor has reached so far ('' = not yet).
  function choice() {
    var s = val('service');
    if (s === 'airport') return val('airport');
    if (s === 'day') {
      var a = val('area');
      if (a === 'seoul') return 'seoul';
      if (a === 'out') return val('dest');
    }
    return '';
  }
  function show(key, on) {
    form.querySelectorAll('[data-show="' + key + '"]').forEach(function (el) { el.hidden = !on; });
  }
  function update() {
    var s = val('service'), a = val('area');
    show('airport', s === 'airport');
    show('day', s === 'day');
    show('out', s === 'day' && a === 'out');
    show('other', s === 'day' && a === 'out' && val('dest') === 'other');
    var c = choice();
    priceBox.hidden = !c;
    if (c) priceVal.textContent = choices[c].price ? '\\u20a9' + fmt.format(choices[c].price) : quote;
  }
  form.addEventListener('change', update);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var date = form.date.value;
    var c = choice();
    var from = form.from.value.trim(), to = form.to.value.trim();
    if (!name || !date || !c || (c === 'other' && (!from || !to))) { err.hidden = false; return; }
    err.hidden = true;
    var lines = ['Hi Pak Lee! Booking request:',
      'Name: ' + name,
      'Date: ' + date,
      'People: ' + form.people.value,
      'Service: ' + choices[c].en];
    if (c === 'other') lines.push('From: ' + from, 'To: ' + to);
    lines.push('Price: ' + (choices[c].price ? '\\u20a9' + choices[c].price.toLocaleString('en-US') : 'quote needed'));
    if (form.hotel.value.trim()) lines.push('Hotel/pickup: ' + form.hotel.value.trim());
    if (form.message.value.trim()) lines.push('Message: ' + form.message.value.trim());
    var text = lines.join('\\n');
    var url = 'https://wa.me/${WA_NUMBER}?text=' + encodeURIComponent(text);
    try { sessionStorage.setItem('plWa', url); sessionStorage.setItem('plSummary', text); } catch (x) {}
    if (!useLine) window.open(url, '_blank');
    location.href = thanks;
  });
})();
</script>`;
};

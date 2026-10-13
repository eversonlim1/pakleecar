const { esc } = require('../src/html');
const { pageUrl } = require('../build.config');

const WA_NUMBER = '821094157859';
// Pak Lee reads English, so the WhatsApp message itself uses English labels
// whatever language the form is shown in.
const TOUR_EN = ['Seoul day trip (10 hours)', 'Nami Island', 'Airport pickup', 'Airport drop-off', 'Something else'];

function js(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

module.exports = function book({ lang, data }) {
  const options = data.tours.map((t, i) => `<option value="${i}">${esc(t)}</option>`).join('');
  const people = Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}"${i === 1 ? ' selected' : ''}>${i + 1}</option>`).join('');

  return `<main class="bk"><div class="wrap bk-wrap">
<h1>${esc(data.h1)}</h1>
<p class="bk-lede">${esc(data.lede)}</p>
<form class="bk-form" id="bkForm" novalidate>
<label>${esc(data.name)}<input name="name" type="text" autocomplete="name" required></label>
<div class="bk-row">
<label>${esc(data.date)}<input name="date" type="date" required></label>
<label>${esc(data.people)}<select name="people">${people}</select></label>
</div>
<label>${esc(data.tour)}<select name="tour">${options}</select></label>
<label>${esc(data.hotel)}<input name="hotel" type="text"></label>
<label>${esc(data.message)}<textarea name="message" rows="3"></textarea></label>
<p class="bk-err" id="bkErr" role="alert" hidden>${esc(data.required)}</p>
<button class="pbtn pbtn-or bk-submit" type="submit">${esc(data.submit)}</button>
<p class="bk-note">${esc(data.note)}</p>
</form>
</div></main>
<script>
(function () {
  var form = document.getElementById('bkForm');
  var err = document.getElementById('bkErr');
  var tours = ${js(TOUR_EN)};
  var thanks = ${js(pageUrl(lang, 'thanks'))};
  var d = new Date();
  form.date.min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var date = form.date.value;
    if (!name || !date) { err.hidden = false; return; }
    err.hidden = true;
    var lines = ['Hi Pak Lee! Booking request:',
      'Name: ' + name,
      'Date: ' + date,
      'People: ' + form.people.value,
      'Tour: ' + tours[+form.tour.value]];
    if (form.hotel.value.trim()) lines.push('Hotel/pickup: ' + form.hotel.value.trim());
    if (form.message.value.trim()) lines.push('Message: ' + form.message.value.trim());
    var url = 'https://wa.me/${WA_NUMBER}?text=' + encodeURIComponent(lines.join('\\n'));
    try { sessionStorage.setItem('plWa', url); } catch (x) {}
    window.open(url, '_blank');
    location.href = thanks;
  });
})();
</script>`;
};

const { esc, img } = require('../src/html');

module.exports = function shareTour({ lang, data }) {
  const stats = data.hero.stats.map(s =>
    `<div class="ststat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('');

  const priceHead = data.priceLabels.map(l => `<th>${esc(l)}</th>`).join('');

  const routeCards = data.routes.map(r => {
    const stops = r.stops.map(s => `<li>${esc(s)}</li>`).join('');
    const note = r.note ? `<li class="stnote-li">${esc(r.note)}</li>` : '';
    const prices = r.prices.map(p => `<td class="amount">${esc(p)}</td>`).join('');
    return `<div class="stcard" id="route-${esc(r.id)}">
<div class="stcard-body">
<h3>${esc(r.title)}</h3>
<ul class="ststops">${stops}${note}</ul>
<table class="sttable">
<thead><tr>${priceHead}</tr></thead>
<tbody><tr>${prices}</tr></tbody>
</table>
<p class="stpricenote">${esc(r.priceNote)}</p>
<div id="shared-calendar-${esc(r.id)}" class="stcal"></div>
<div class="stfoot">
<button type="button" class="btn stask" data-label="${esc(r.waLabel)}">${esc(r.cta)}</button>
</div>
</div>
</div>`;
  }).join('\n');

  const chips = data.about.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('');

  const conceptCards = data.concept.cards.map(c =>
    `<div class="stconcept-card"><h3>${esc(c.title)}</h3><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`
  ).join('');

  const specs = data.vehicle.specs.map(s =>
    `<div class="spec"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('');

  const steps = data.howToBook.steps.map((s, i) =>
    `<div class="stbook-card"><div class="stbook-num">${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div>`
  ).join('');

  const routesJson = JSON.stringify(data.routes.map(r => ({ id: r.id, waLabel: r.waLabel })))
    .replace(/</g, '\\u003c');
  const waJson = JSON.stringify(data.wa).replace(/</g, '\\u003c');

  return `<main class="stpage">
<header class="sthero"><div class="wrap">
<span class="badge">${esc(data.hero.badge)}</span>
<h1>${esc(data.hero.h1)}</h1>
<p class="ld">${esc(data.hero.sub)}</p>
<div class="cta">
<a class="a" href="#routes">${esc(data.hero.ctaSchedule)}</a>
<a class="b" href="#concept">${esc(data.hero.ctaConcept)}</a>
</div>
<div class="ststats">${stats}</div>
</div></header>

<section class="stroutes" id="routes"><div class="wrap">
<span class="eyebrow">${esc(data.routesSection.label)}</span>
<h2>${esc(data.routesSection.title)}</h2>
<p class="sub">${esc(data.routesSection.sub)}</p>
<div class="stgrid">${routeCards}</div>
</div></section>

<section class="staboutp"><div class="wrap stabout-grid">
<div class="stchips">${chips}</div>
<div>
<span class="eyebrow">${esc(data.about.label)}</span>
<p class="stgreet">${esc(data.about.greeting)}</p>
<h2>${esc(data.about.h2)}</h2>
<p>${esc(data.about.body)}</p>
</div>
</div></section>

<section class="stconcept" id="concept"><div class="wrap">
<span class="eyebrow">${esc(data.concept.label)}</span>
<h2>${esc(data.concept.title)}</h2>
<p class="sub">${esc(data.concept.sub)}</p>
<div class="stconcept-grid">${conceptCards}</div>
<p class="stalert"><strong>${esc(data.concept.noteLabel)}</strong> ${esc(data.concept.note)}</p>
</div></section>

<section class="stvehicle"><div class="wrap stvehicle-grid">
<div>
<span class="eyebrow">${esc(data.vehicle.label)}</span>
<h2>${esc(data.vehicle.title)}</h2>
<p>${esc(data.vehicle.body)}</p>
<div class="specs">${specs}</div>
<p class="stfootnote">${esc(data.vehicle.footnote)}</p>
</div>
<div class="gal">
${img({ src: '/assets/img/staria-ext.jpg', alt: 'Hyundai Staria Lounge exterior', width: 720, height: 960 })}
${img({ src: '/assets/img/staria-int1.jpg', alt: 'Staria Lounge interior seats', width: 720, height: 480 })}
${img({ src: '/assets/img/staria-int3.jpg', alt: 'Staria Lounge rear seats', width: 720, height: 480 })}
</div>
</div></section>

<section class="stbook" id="how-to-book"><div class="wrap">
<span class="eyebrow">${esc(data.howToBook.label)}</span>
<h2>${esc(data.howToBook.title)}</h2>
<p class="sub">${esc(data.howToBook.sub)}</p>
<div class="stbook-grid">${steps}</div>
</div></section>
</main>

<script>
(function () {
  var WA_MESSAGES = ${waJson};
  var ROUTES = ${routesJson};
  var CAL_ROUTES = ROUTES.map(function (r) { return r.id; });
  var calState = {};
  CAL_ROUTES.forEach(function (r) {
    var now = new Date();
    calState[r] = { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  function calMonthStr(route) {
    var s = calState[route];
    return s.year + '-' + String(s.month).padStart(2, '0');
  }

  async function loadCalendar(route) {
    var container = document.getElementById('shared-calendar-' + route);
    if (!container) return;
    var monthStr = calMonthStr(route);
    var days = [];
    try {
      var res = await fetch('/api/bookings?route=' + route + '&month=' + monthStr);
      if (res.ok) {
        var data = await res.json();
        days = data.days || [];
      }
    } catch (e) {
      // Network/API unavailable — render an empty calendar rather than breaking the page.
    }
    renderCalendar(route, monthStr, days);
  }

  function renderCalendar(route, monthStr, days) {
    var container = document.getElementById('shared-calendar-' + route);
    var byDate = {};
    days.forEach(function (d) { byDate[d.date] = d; });

    var parts = monthStr.split('-').map(Number);
    var year = parts[0], month = parts[1];
    var firstDow = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();

    var dowLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    var cellsHtml = dowLabels.map(function (d) { return '<div class="dow">' + d + '</div>'; }).join('');
    for (var i = 0; i < firstDow; i++) {
      cellsHtml += '<div class="mini-cal-day empty"></div>';
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = monthStr + '-' + String(day).padStart(2, '0');
      var info = byDate[dateStr];
      var statusClass = info ? info.status : '';
      var badge = info ? '<span class="n">' + info.pax + '</span>' : '';
      cellsHtml += '<div class="mini-cal-day ' + statusClass + '" data-date="' + dateStr + '" data-route="' + route + '">' + day + badge + '</div>';
    }

    container.innerHTML =
      '<div class="mini-cal">' +
      '<div class="mini-cal-head">' +
      '<button type="button" data-nav="-1">‹</button>' +
      '<span>' + monthStr + '</span>' +
      '<button type="button" data-nav="1">›</button>' +
      '</div>' +
      '<div class="mini-cal-grid">' + cellsHtml + '</div>' +
      '<div class="mini-cal-legend">' +
      '<span><i style="background:#F0FDF4;border:1px solid #86EFAC"></i>Confirmed</span>' +
      '<span><i style="background:#FFFBEB;border:1px solid #FCD34D"></i>Pending (&lt;4)</span>' +
      '<span><i style="background:#FEF2F2;border:1px solid #FCA5A5"></i>Full</span>' +
      '</div>' +
      '</div>';

    container.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () { calNav(route, Number(btn.dataset.nav)); });
    });
    container.querySelectorAll('.mini-cal-day').forEach(function (el) {
      el.addEventListener('click', function () { calDayClick(el); });
    });
  }

  function calNav(route, delta) {
    var s = calState[route];
    s.month += delta;
    if (s.month < 1) { s.month = 12; s.year -= 1; }
    if (s.month > 12) { s.month = 1; s.year += 1; }
    loadCalendar(route);
  }

  function calDayClick(el) {
    if (!el.classList.contains('confirmed')) return; // only confirmed days invite joining
    var date = el.dataset.date;
    var route = el.dataset.route;
    var routeInfo = ROUTES.find(function (r) { return r.id === route; });
    var label = routeInfo ? routeInfo.waLabel : route;
    var msg = WA_MESSAGES.join.replace('{route}', label).replace('{date}', date);
    window.open('https://wa.me/821094157859?text=' + encodeURIComponent(msg), '_blank');
  }

  CAL_ROUTES.forEach(loadCalendar);

  document.querySelectorAll('.stask').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var msg = WA_MESSAGES.ask.replace('{name}', btn.dataset.label);
      window.open('https://wa.me/821094157859?text=' + encodeURIComponent(msg), '_blank');
    });
  });
})();
</script>`;
};

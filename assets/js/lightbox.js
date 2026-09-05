(function () {
  var lb = document.getElementById('lb');
  if (!lb) return;
  var fr = document.getElementById('lbFrame');
  var ct = document.getElementById('lbCount');
  var items = [].slice.call(document.querySelectorAll('[data-reel]'));
  if (!items.length) return;
  var i = 0;

  function show(n) {
    i = (n + items.length) % items.length;
    fr.src = 'https://www.instagram.com/reel/' + items[i].dataset.reel + '/embed/captioned/';
    ct.textContent = (i + 1) + ' / ' + items.length;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    fr.src = '';
    document.body.style.overflow = '';
  }
  items.forEach(function (el, n) {
    el.addEventListener('click', function (e) { e.preventDefault(); show(n); });
  });
  [].slice.call(document.querySelectorAll('[data-open]')).forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var id = el.dataset.open, n = 0;
      items.forEach(function (it, k) { if (it.dataset.reel === id) n = k; });
      show(n);
    });
  });
  document.getElementById('lbClose').onclick = close;
  document.getElementById('lbPrev').onclick = function () { show(i - 1); };
  document.getElementById('lbNext').onclick = function () { show(i + 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
})();

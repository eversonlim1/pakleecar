(function () {
  var lb = document.getElementById('lb');
  if (!lb) return;
  var fr = document.getElementById('lbFrame');
  var ct = document.getElementById('lbCount');
  var items = [].slice.call(document.querySelectorAll('.strip [data-reel]'));
  if (!items.length) return;
  var i = 0;
  var lastFocused = null;

  function focusableInDialog() {
    return [].slice.call(lb.querySelectorAll('#lbClose, #lbPrev, #lbNext'))
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function show(n) {
    var wasOpen = lb.classList.contains('open');
    i = (n + items.length) % items.length;
    fr.src = 'https://www.instagram.com/reel/' + items[i].dataset.reel + '/embed/captioned/';
    ct.textContent = (i + 1) + ' / ' + items.length;
    if (!wasOpen) {
      lastFocused = document.activeElement;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      var focusables = focusableInDialog();
      if (focusables.length) focusables[0].focus();
    }
  }
  function close() {
    lb.classList.remove('open');
    fr.src = '';
    document.body.style.overflow = '';
    var target = lastFocused && document.contains(lastFocused) ? lastFocused : document.body;
    lastFocused = null;
    try { target.focus(); } catch (e) { /* noop */ }
  }
  function trapTab(e) {
    if (e.key !== 'Tab') return;
    var focusables = focusableInDialog();
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !lb.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !lb.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
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
    if (e.key === 'Tab') trapTab(e);
  });
})();

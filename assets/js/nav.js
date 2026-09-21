(function () {
  var hamburger = document.querySelector('.hamburger');
  var menu = document.querySelector('.mobile-menu');
  var close = menu ? menu.querySelector('.mm-close') : null;

  if (!hamburger || !menu) return;

  function open() {
    menu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function shut() {
    menu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', function () {
    if (menu.classList.contains('open')) {
      shut();
    } else {
      open();
    }
  });

  if (close) {
    close.addEventListener('click', shut);
  }

  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', shut);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      shut();
    }
  });
})();

(function () {
  document.querySelectorAll('.strip-wrap').forEach(function (wrap) {
    var strip = wrap.querySelector('.strip');
    var prev = wrap.querySelector('.sbtn.prev');
    var next = wrap.querySelector('.sbtn.next');
    if (!strip || !prev || !next) return;

    function update() {
      var max = strip.scrollWidth - strip.clientWidth - 1;
      prev.disabled = strip.scrollLeft <= 0;
      next.disabled = strip.scrollLeft >= max;
    }

    prev.addEventListener('click', function () {
      strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
      strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: 'smooth' });
    });
    strip.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  });
})();

(function () {
  var ilb = document.getElementById('ilb');
  var ilbImg = document.getElementById('ilbImg');
  var ilbX = document.getElementById('ilbX');
  var pics = document.querySelectorAll('.car .gal picture');
  if (!ilb || !ilbImg || !ilbX || !pics.length) return;

  function open(src, alt) {
    ilbImg.src = src;
    ilbImg.alt = alt || '';
    ilb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    ilb.classList.remove('open');
    ilbImg.src = '';
    document.body.style.overflow = '';
  }

  pics.forEach(function (pic) {
    pic.addEventListener('click', function () {
      var img = pic.querySelector('img');
      if (!img) return;
      open(img.currentSrc || img.src, img.alt);
    });
  });
  ilbX.addEventListener('click', close);
  ilb.addEventListener('click', function (e) { if (e.target === ilb) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ilb.classList.contains('open')) close();
  });
})();

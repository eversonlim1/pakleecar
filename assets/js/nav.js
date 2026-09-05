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

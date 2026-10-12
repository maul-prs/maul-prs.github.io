// Menu hamburger (mobile)
(function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('navMenu');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', function () { nav.classList.toggle('active'); });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('active') && !nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('active');
  });
})();

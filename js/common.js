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

// Simpan pilihan bahasa (ID / EN) supaya halaman berikutnya langsung memakai bahasa yang sama
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('.lang-btn[data-lang]');
  if (!a) return;
  try { localStorage.setItem('maul_lang', a.getAttribute('data-lang')); } catch (err) {}
});

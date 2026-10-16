/* Tombol bagikan di halaman artikel: Bagikan (HP), WhatsApp (tautan biasa), Salin tautan */
(function () {
  'use strict';

  function fallbackCopy(text) {
    try {
      var t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t);
      t.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(t);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  // Ganti teks tombol sebentar (mis. "✓ Tersalin"), lalu kembalikan
  function flash(btn, text) {
    if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
    btn.textContent = text;
    clearTimeout(btn._flash);
    btn._flash = setTimeout(function () { btn.textContent = btn.getAttribute('data-label'); }, 1800);
  }

  window.MaulShare = { copy: copy, flash: flash };

  var bar = document.getElementById('shareBar');
  if (!bar) return;
  var url = bar.getAttribute('data-url');
  var title = bar.getAttribute('data-title');
  var nativeBtn = bar.querySelector('[data-share="native"]');
  var copyBtn = bar.querySelector('[data-share="copy"]');

  if (nativeBtn && navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener('click', function () {
      navigator.share({ title: title, url: url }).catch(function () { /* dibatalkan pengguna */ });
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copy(url).then(function (ok) { flash(copyBtn, ok ? '✓ Tersalin' : 'Gagal menyalin'); });
    });
  }
})();

// Halaman artikel: mode fokus, teks Arab di HP, dan sidebar kategori (dimuat saat dibutuhkan)
(function () {
  var root = document.documentElement;
  var I = window.MaulI18n || { lang: 'id', t: function (k) { return k; } };
  var EN = I.lang === 'en';

  /* ---- Mode fokus ---- */
  var btn = document.getElementById('focusBtn');
  var txt = document.getElementById('focusBtnText');
  function syncFocus() { if (txt) txt.textContent = I.t(root.classList.contains('focus-mode') ? 'focusOff' : 'focusOn'); }
  if (btn) {
    syncFocus();
    btn.addEventListener('click', function () {
      root.classList.toggle('focus-mode');
      try { localStorage.setItem('maul_focus_mode', root.classList.contains('focus-mode') ? 'enabled' : 'disabled'); } catch (e) {}
      syncFocus();
    });
  }

  /* ---- Tandai teks Arab agar ukurannya bisa diatur di layar HP ---- */
  var content = document.getElementById('articleContent');
  if (content) {
    var re = /[\u0600-\u06FF]/;
    content.querySelectorAll('*').forEach(function (el) {
      if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === 3 && re.test(n.nodeValue)) { el.classList.add('arabic-text'); break; }
      }
    });
  }

  /* ---- Sidebar kiri: kategori & daftar tulisan ---- */
  var box = document.getElementById('accordionContainer');
  if (!box) return;
  // Di HP menu samping disembunyikan (mode fokus otomatis), jadi tidak perlu dimuat
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;
  var curSlug = box.dataset.slug;
  var curTags = [];
  try { curTags = JSON.parse(box.dataset.tags || '[]'); } catch (e) {}
  var STEP = 30, MAX_TAGS = 40;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  fetch(box.dataset.index)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var map = {};
      data.forEach(function (p) {
        if (p.status === 'archived') return;
        (p.categories && p.categories.length ? p.categories : [p.type]).forEach(function (t) {
          (map[t] = map[t] || []).push(p);
        });
      });
      var tags = Object.keys(map).sort(function (a, b) {
        var ca = curTags.indexOf(a) !== -1, cb = curTags.indexOf(b) !== -1;
        if (ca !== cb) return ca ? -1 : 1;
        return map[b].length - map[a].length || a.localeCompare(b);
      });

      function itemsHtml(list, from) {
        var slice = list.slice(from, from + STEP);
        var html = slice.map(function (p) {
          return '<li class="acc-post-item"><a href="' + esc(EN && p.en ? p.en.url : p.url) + '"' + (p.slug === curSlug ? ' class="current-article"' : '') + '>' + esc(EN && p.en ? p.en.title : p.title) + '</a></li>';
        }).join('');
        if (from + STEP < list.length) {
          html += '<li class="acc-more-item"><button type="button" class="acc-more" data-from="' + (from + STEP) + '">' + esc(I.t('showMore', { n: list.length - from - STEP })) + '</button></li>';
        }
        return html;
      }

      function tagHtml(tag, open) {
        return '<div class="acc-category-item" data-tag="' + esc(tag) + '">' +
          '<button type="button" class="acc-btn' + (open ? ' active' : '') + '"><span>🏷️ ' + esc(tag) + ' (' + map[tag].length + ')</span><span class="acc-icon">▼</span></button>' +
          '<ul class="acc-post-list' + (open ? ' open' : '') + '"' + (open ? '' : ' data-empty="1"') + '>' + (open ? itemsHtml(map[tag], 0) : '') + '</ul></div>';
      }

      var html = tags.slice(0, MAX_TAGS).map(function (t) { return tagHtml(t, curTags.indexOf(t) !== -1); }).join('');
      if (tags.length > MAX_TAGS) html += '<button type="button" class="acc-more acc-all-tags">' + esc(I.t('showAllTags', { n: tags.length - MAX_TAGS })) + '</button>';
      box.innerHTML = html;

      box.addEventListener('click', function (e) {
        var more = e.target.closest('.acc-more');
        if (more && more.classList.contains('acc-all-tags')) {
          more.insertAdjacentHTML('beforebegin', tags.slice(MAX_TAGS).map(function (t) { return tagHtml(t, false); }).join(''));
          more.remove();
          return;
        }
        if (more) {
          var tag = more.closest('.acc-category-item').dataset.tag;
          var li = more.parentElement;
          li.insertAdjacentHTML('beforebegin', itemsHtml(map[tag], parseInt(more.dataset.from, 10)).replace(/<li class="acc-more-item">[\s\S]*$/, ''));
          var next = parseInt(more.dataset.from, 10) + STEP;
          if (next < map[tag].length) {
            more.dataset.from = next;
            more.textContent = I.t('showMore', { n: map[tag].length - next });
          } else { li.remove(); }
          return;
        }
        var b = e.target.closest('.acc-btn');
        if (!b) return;
        var ul = b.nextElementSibling;
        b.classList.toggle('active');
        ul.classList.toggle('open');
        if (ul.dataset.empty) {
          ul.innerHTML = itemsHtml(map[b.parentElement.dataset.tag], 0);
          delete ul.dataset.empty;
        }
      });
    })
    .catch(function () { box.innerHTML = '<p style="color:#777;font-size:12px;">' + esc(I.t('menuFail')) + '</p>'; });
})();

// Chip kategori: tombol "+N lagi" membuka chip yang disembunyikan
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.article-tags [data-more]');
  if (!b) return;
  b.parentNode.classList.add('open');
  b.remove();
});

// Posisi baca: simpan di browser (localStorage), tanpa server.
//  - Halaman artikel Book Summary: bar progres, persen, simpan posisi, banner "Lanjut dari X%?"
//  - Beranda: strip "Lanjutkan Membaca" (dirender sinkron dari data di browser, tanpa menunggu index.json)
(function () {
  'use strict';

  var KEY = 'maul_reading_v1';
  var MIN_PCT = 5;          // di bawah ini dianggap baru membuka, tidak disimpan
  var DONE_PCT = 95;        // sampai sini = selesai, keluar dari strip
  var STALE_DAYS = 30;      // tidak disentuh selama ini = tidak ditagih lagi di beranda
  var KEEP_DAYS = 180;      // dibuang total dari browser setelah ini
  var KEEP_DONE_DAYS = 365; // bacaan yang sudah tamat disimpan lebih lama supaya tanda ✓ tidak cepat hilang
  var MAX_ENTRIES = 40;
  var MAX_STRIP = 3;
  var HDR = 90;             // garis baca: tepat di bawah header yang menempel
  var DAY = 86400000;

  // Data di localStorage bisa saja rusak/diubah: angka selalu dipaksa menjadi angka sebelum dipakai
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  /* ---------------- Penyimpanan ---------------- */
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || '{}');
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch (e) { return {}; }
  }

  function store(db) {
    var now = Date.now();
    var keys = Object.keys(db).filter(function (k) {
      return db[k] && now - (db[k].t || 0) < (db[k].done ? KEEP_DONE_DAYS : KEEP_DAYS) * DAY;
    }).sort(function (a, b) { return (db[b].t || 0) - (db[a].t || 0); }).slice(0, MAX_ENTRIES);
    var out = {};
    keys.forEach(function (k) { out[k] = db[k]; });
    try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // hanya alamat artikel internal yang boleh dipakai sebagai link
  function safeUrl(u) { return typeof u === 'string' && /^\/artikel\/[^\s"'<>]+$/.test(u); }

  function coverSrc(e) {
    if (e.cover) return /^https?:/i.test(e.cover) ? e.cover : encodeURI('/' + String(e.cover).replace(/^\/+/, ''));
    return window.placeholderCover ? window.placeholderCover(e.type) : '';
  }

  function resumable(e, now) {
    return !!e && typeof e === 'object' && !e.done && !e.dismissed && num(e.pct) >= MIN_PCT && num(e.pct) < DONE_PCT &&
      safeUrl(e.url) && now - (e.t || 0) < STALE_DAYS * DAY;
  }

  function ago(t) {
    var a = new Date(t); a.setHours(0, 0, 0, 0);
    var b = new Date(); b.setHours(0, 0, 0, 0);
    var d = Math.round((b - a) / DAY);
    if (d <= 0) return 'hari ini';
    if (d === 1) return 'kemarin';
    return d + ' hari lalu';
  }

  /* ---------------- Beranda: strip "Lanjutkan Membaca" ---------------- */
  var stripBound = false;

  function cardHtml(e) {
    var href = esc(e.url) + '?lanjut=1';
    return '<div class="resume-card">' +
      '<a class="resume-cover-link" href="' + href + '" tabindex="-1" aria-hidden="true">' +
      '<img class="resume-cover" src="' + esc(coverSrc(e)) + '" alt="" data-t="' + esc(e.type) + '" decoding="async" onerror="coverFallback(this)" /></a>' +
      '<div class="resume-info">' +
      '<a class="resume-title" href="' + href + '">' + esc(e.title) + '</a>' +
      '<p class="resume-meta">' + e.pct + '% · terakhir dibaca ' + ago(e.t) + '</p>' +
      '<div class="resume-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + e.pct + '"><span style="width:' + e.pct + '%"></span></div>' +
      '<a class="button resume-go" href="' + href + '">Lanjutkan</a>' +
      '</div>' +
      '<button class="resume-x" type="button" data-dismiss="' + esc(e.slug) + '" aria-label="Sembunyikan ' + esc(e.title) + '">×</button>' +
      '</div>';
  }

  function renderStrip() {
    var box = document.getElementById('resumeStrip');
    if (!box) return;
    var db = load(), now = Date.now();
    var list = Object.keys(db).filter(function (k) { return db[k] && typeof db[k] === 'object'; })
      .map(function (k) { db[k].slug = k; db[k].pct = Math.round(num(db[k].pct)); return db[k]; })
      .filter(function (e) { return resumable(e, now); })
      .sort(function (a, b) { return b.t - a.t; })
      .slice(0, MAX_STRIP);
    if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = '<div class="resume-head"><span class="resume-label">Lanjutkan Membaca</span></div>' +
      '<div class="resume-list">' + list.map(cardHtml).join('') + '</div>';
    box.hidden = false;

    if (!stripBound) {
      stripBound = true;
      box.addEventListener('click', function (ev) {
        var x = ev.target.closest('[data-dismiss]');
        if (!x) return;
        var d = load(), slug = x.getAttribute('data-dismiss');
        if (d[slug]) { d[slug].dismissed = 1; store(d); }
        renderStrip();
      });
    }
  }

  // Dipanggil home.js setelah index.json dimuat: buang bacaan yang sudah dihapus/diarsipkan,
  // dan segarkan judul/cover kalau berubah.
  function reconcile(list) {
    var db = load(), by = {}, changed = false;
    list.forEach(function (p) { if (p.status !== 'archived') by[p.slug] = p; });
    Object.keys(db).forEach(function (slug) {
      var p = by[slug];
      if (!p) { delete db[slug]; changed = true; return; }
      if (db[slug].title !== p.title || db[slug].cover !== (p.cover || '')) {
        db[slug].title = p.title; db[slug].cover = p.cover || ''; db[slug].type = p.type; changed = true;
      }
    });
    if (changed) { store(db); renderStrip(); }
  }

  /* ---------------- Kartu: tanda ✓ untuk bacaan yang sudah selesai ---------------- */
  function slugOf(href) {
    var m = /^\/artikel\/([^\/?#]+)/.exec(href || '');
    if (!m) return '';
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }

  // Dipanggil untuk semua kartu (beranda, arsip, kategori) dan setiap kali home.js menggambar ulang kartu
  function markCards(root) {
    var db = load();
    [].forEach.call((root || document).querySelectorAll('a.post-card'), function (card) {
      var slug = slugOf(card.getAttribute('href'));
      var e = slug ? db[slug] : null;
      var done = !!(e && typeof e === 'object' && e.done);
      var mark = card.querySelector('.post-card-done');
      if (done && !mark) {
        mark = document.createElement('span');
        mark.className = 'post-card-done';
        mark.setAttribute('role', 'img');
        mark.setAttribute('aria-label', 'Sudah selesai dibaca');
        mark.title = 'Sudah selesai dibaca';
        mark.textContent = '✓';
        card.appendChild(mark);
      } else if (!done && mark) {
        mark.remove();
      }
      card.classList.toggle('is-done', done);
    });
  }

  /* ---------------- Artikel: lacak posisi ---------------- */
  function track(art) {
    var slug = art.getAttribute('data-slug');
    if (!slug) return;
    var bar = document.querySelector('#readProgress span');
    var pill = document.getElementById('readPct');
    var banner = null, bannerTimer = null;
    var hold = 0;   // selama ada posisi lama yang belum diputuskan, jangan ditimpa posisi yang lebih kecil
    var raf = 0, saveTimer = 0, lastSave = 0;

    function geo() {
      var r = art.getBoundingClientRect();
      var top = r.top + window.pageYOffset;
      return { top: top, h: art.offsetHeight, span: art.offsetHeight - window.innerHeight + HDR };
    }

    function heads() {
      return [].slice.call(art.querySelectorAll('h2[id], h3[id]')).map(function (h) {
        return { id: h.id, el: h, y: h.getBoundingClientRect().top + window.pageYOffset };
      });
    }

    // posisi baca saat ini: persen + bagian terakhir (heading) + posisi relatif di dalam bagian itu
    function position() {
      var g = geo();
      if (g.span < 200) return { pct: 0, sec: '', r: 0, short: true };
      var L = window.pageYOffset + HDR;
      var pct = Math.max(0, Math.min(100, ((L - g.top) / g.span) * 100));
      var hs = heads(), idx = -1;
      for (var i = 0; i < hs.length; i++) { if (hs[i].y <= L) idx = i; else break; }
      var start = idx < 0 ? g.top : hs[idx].y;
      var end = idx + 1 < hs.length ? hs[idx + 1].y : g.top + g.h;
      var r = end > start ? Math.max(0, Math.min(1, (L - start) / (end - start))) : 0;
      return { pct: pct, sec: idx < 0 ? '' : hs[idx].id, r: Math.round(r * 1000) / 1000 };
    }

    // dari data tersimpan -> posisi scroll (tahan terhadap perubahan lebar layar & font)
    function targetY(e) {
      var g = geo(), hs = heads(), idx = -2, i;
      if (e.sec) { for (i = 0; i < hs.length; i++) if (hs[i].id === e.sec) { idx = i; break; } }
      else idx = -1;
      if (idx !== -2 && typeof e.r === 'number') {
        var start = idx < 0 ? g.top : hs[idx].y;
        var end = idx + 1 < hs.length ? hs[idx + 1].y : g.top + g.h;
        return Math.max(0, start + e.r * (end - start) - HDR);
      }
      return Math.max(0, g.top + (e.pct / 100) * g.span - HDR); // heading hilang (artikel diedit): pakai persen
    }

    function jump(e) {
      function go() {
        var y = targetY(e);
        try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (err) { window.scrollTo(0, y); }
        return y;
      }
      var y0 = go();
      // gambar/font yang terlambat dimuat menggeser layout: koreksi sekali, kalau pembaca belum menggulir sendiri
      if (document.readyState !== 'complete') {
        window.addEventListener('load', function () {
          if (Math.abs(window.pageYOffset - y0) < 8) go();
        });
      }
    }

    function sectionTitle(id) {
      var el = id && document.getElementById(id);
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    /* ---- simpan ---- */
    function save() {
      clearTimeout(saveTimer);
      lastSave = Date.now();
      var p = position();
      if (p.short || p.pct < MIN_PCT) return;
      if (hold && p.pct < hold) return;
      hold = 0;
      var db = load(), e = db[slug] || {};
      if (e.done && p.pct < DONE_PCT) return; // sudah tamat: membaca ulang tidak menghidupkannya lagi
      e.url = art.getAttribute('data-url');
      e.title = art.getAttribute('data-title');
      e.cover = art.getAttribute('data-cover') || '';
      e.type = art.getAttribute('data-type') || '';
      e.t = Date.now();
      delete e.dismissed; // membaca lagi = tertarik lagi
      if (p.pct >= DONE_PCT) { e.done = 1; e.pct = 100; e.sec = ''; e.r = 0; }
      else { e.pct = Math.round(p.pct); e.sec = p.sec; e.r = p.r; }
      db[slug] = e;
      store(db);
    }

    /* ---- UI ---- */
    function paint() {
      raf = 0;
      var p = position();
      var v = Math.round(p.pct);
      if (bar) bar.style.width = (p.short ? 0 : p.pct) + '%';
      if (pill) {
        pill.textContent = v + '%';
        pill.classList.toggle('on', !p.short && v >= 1 && !banner);
      }
      if (hold && p.pct >= hold) hold = 0;
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(paint);
      clearTimeout(saveTimer);
      // simpan saat berhenti menggulir (700 ms), tapi paling lama 3 detik sekali walau terus menggulir
      if (Date.now() - lastSave > 3000) save();
      else saveTimer = setTimeout(save, 700);
    }

    function closeBanner() {
      if (!banner) return;
      clearTimeout(bannerTimer);
      banner.remove();
      banner = null;
      paint();
    }

    function showBanner(e) {
      var sec = sectionTitle(e.sec);
      banner = document.createElement('div');
      banner.className = 'resume-banner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Lanjutkan membaca');
      banner.innerHTML =
        '<div class="resume-banner-text"><strong>Lanjut dari ' + e.pct + '%?</strong>' +
        (sec ? '<span>Terakhir di: ' + esc(sec) + '</span>' : '') + '</div>' +
        '<div class="resume-banner-actions">' +
        '<button type="button" class="button resume-banner-go" data-act="go">Lanjutkan</button>' +
        '<button type="button" class="resume-banner-restart" data-act="restart">Dari awal</button>' +
        '<button type="button" class="resume-banner-x" data-act="close" aria-label="Tutup">×</button></div>';
      document.body.appendChild(banner);
      banner.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        if (act === 'go') { hold = 0; jump(e); }
        else if (act === 'restart') { hold = 0; var d = load(); delete d[slug]; store(d); }
        closeBanner(); // "×" saja: posisi lama tetap aman sampai pembaca melewatinya
      });
      bannerTimer = setTimeout(closeBanner, 15000);
      if (pill) pill.classList.remove('on');
    }

    /* ---- mulai ---- */
    var go = false;
    try {
      go = new URLSearchParams(location.search).get('lanjut') === '1';
      if (go) history.replaceState(null, '', location.pathname + location.hash); // alamat tetap bersih
    } catch (err) {}

    var saved = load()[slug];
    if (saved && typeof saved === 'object') saved.pct = Math.round(num(saved.pct)); else saved = null;
    var canResume = saved && !saved.done && saved.pct >= MIN_PCT && saved.pct < DONE_PCT;
    // kalau browser sudah memulihkan posisi gulir sendiri (reload/kembali), tidak perlu banner
    if (canResume && window.pageYOffset < 40) {
      if (go) jump(saved);          // datang dari strip beranda: langsung lompat, tanpa konfirmasi
      else { hold = saved.pct; showBanner(saved); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(paint); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
    window.addEventListener('pagehide', save);
    paint();
  }

  window.MaulReading = { renderStrip: renderStrip, reconcile: reconcile, track: track, markCards: markCards };

  // Tanda ✓ pada kartu: saat halaman siap, saat kembali lewat tombol Kembali, dan saat tab lain mengubah data
  function initCards() { markCards(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCards); else initCards();
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) markCards(); });
  window.addEventListener('storage', function (ev) {
    if (ev.key !== KEY) return;
    markCards();
    if (document.getElementById('resumeStrip')) renderStrip();
  });

  // Beranda: skrip ini dimuat sinkron tepat setelah #resumeStrip, jadi strip muncul di render pertama
  if (document.getElementById('resumeStrip')) {
    renderStrip();
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) renderStrip(); }); // tombol Kembali
  }
  // Artikel yang dilacak
  var art = document.getElementById('articleContent');
  if (art && art.getAttribute('data-track') === '1') {
    var start = function () { track(art); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
})();

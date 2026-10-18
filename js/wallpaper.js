/* Wallpaper doa / quote pendek: digambar di browser pembaca (canvas 1080x1920), tanpa server.
   Data (arab, latin, terjemahan, sumber) datang dari <script id="wpData"> yang dibuat build.js. */
(function () {
  'use strict';

  var panel = document.getElementById('wpPanel');
  var dataEl = document.getElementById('wpData');
  if (!panel || !dataEl) return;

  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var I18n = window.MaulI18n || { t: function (k) { return k; } };
  var canvas = document.getElementById('wpCanvas');
  var ctx = canvas.getContext('2d');
  var W = 1080;
  var H = 1920;
  var MAX_W = 860;          // lebar teks; sisa margin kiri-kanan 110px
  var CENTER_Y = 1030;      // pusat blok teks; area atas dibiarkan lapang untuk jam layar kunci
  var MAX_H = 1140;         // tinggi maksimum blok teks
  var MIN_SCALE = 0.65;     // batas terkecil yang masih nyaman dibaca di HP
  var HARD_MIN = 0.3;       // pilihan terakhir untuk teks sangat panjang (huruf kecil, tapi tidak terpotong)

  var THEMES = [
    { id: 'malam', label: I18n.t('wpNight'), bg: ['#021208', '#04301d'], glow: 'rgba(52,211,153,0.16)', ink: '#f3f1e6', soft: '#b9cdc1', accent: '#34d399' },
    { id: 'emas', label: I18n.t('wpGold'), bg: ['#0a0a0a', '#1c1708'], glow: 'rgba(245,184,46,0.14)', ink: '#f7f0da', soft: '#cbbf99', accent: '#f5b82e' },
    { id: 'krem', label: I18n.t('wpCream'), bg: ['#f8f2e2', '#efe5cc'], glow: 'rgba(15,122,79,0.10)', ink: '#10301f', soft: '#4b6154', accent: '#0f7a4f' }
  ];

  var FONT_FILES = [
    ['WPAmiriAr', 'amiri-arabic-400-normal', '400', 'normal'],
    ['WPAmiriLa', 'amiri-latin-400-italic', '400', 'italic'],
    ['WPAmiriLaX', 'amiri-latin-ext-400-italic', '400', 'italic'],
    ['WPAmiriBold', 'amiri-latin-700-normal', '700', 'normal'],
    ['WPAmiriBoldX', 'amiri-latin-ext-700-normal', '700', 'normal'],
    ['WPPoppins', 'poppins-latin-400-normal', '400', 'normal'],
    ['WPPoppinsX', 'poppins-latin-ext-400-normal', '400', 'normal'],
    ['WPPoppinsSemi', 'poppins-latin-600-normal', '600', 'normal'],
    ['WPPoppinsSemiX', 'poppins-latin-ext-600-normal', '600', 'normal']
  ];

  var hasArabic = !!data.arabic;
  var theme = THEMES[0];
  var blobCache = null;
  var renderToken = 0;

  var elThemes = document.getElementById('wpThemes');
  var elShare = document.getElementById('wpShare');
  var elDownload = document.getElementById('wpDownload');
  var elCaption = document.getElementById('wpCaption');
  var elNote = document.getElementById('wpNote');

  try {
    var saved = localStorage.getItem('maul_wp_theme');
    THEMES.forEach(function (t) { if (t.id === saved) theme = t; });
  } catch (e) { /* storage tidak tersedia: abaikan */ }

  /* ---------- font ---------- */
  function loadFonts() {
    if (!window.FontFace || !document.fonts) return Promise.resolve();
    return Promise.all(FONT_FILES.map(function (f) {
      var face = new FontFace(f[0], 'url(/assets/fonts/' + f[1] + '.woff2) format("woff2")', { weight: f[2], style: f[3] });
      return face.load().then(function (loaded) { document.fonts.add(loaded); }, function () { /* pakai font cadangan */ });
    }));
  }

  /* ---------- tata letak teks ---------- */
  function setFont(spec, rtl) {
    ctx.font = spec;
    ctx.direction = rtl ? 'rtl' : 'ltr';
  }

  function wrap(text, maxW) {
    var lines = [];
    String(text).split(/\n+/).forEach(function (para) {
      var words = para.trim().split(/\s+/).filter(Boolean);
      var line = '';
      words.forEach(function (w) {
        var test = line ? line + ' ' + w : w;
        if (line && ctx.measureText(test).width > maxW) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  // Menyusun semua blok pada skala s, mengembalikan blok + total tinggi
  function layout(s, withLatin) {
    var blocks = [];
    var widest = 0;
    function add(kind, text, font, size, lhMul, rtl, colorKey, gapBefore) {
      if (!text) return;
      setFont(font, rtl);
      var lines = wrap(text, MAX_W);
      lines.forEach(function (l) { widest = Math.max(widest, ctx.measureText(l).width); });
      blocks.push({ kind: kind, lines: lines, font: font, size: size, lh: size * lhMul, rtl: rtl, color: colorKey, gap: gapBefore });
    }
    var q = function (px) { return Math.round(px * s); };

    if (hasArabic) {
      add('ar', data.arabic, '400 ' + q(86) + 'px WPAmiriAr, WPAmiriBold, serif', q(86), 1.85, true, 'ink', 0);
      if (withLatin) add('la', data.latin, 'italic 400 ' + q(38) + 'px WPAmiriLa, WPAmiriLaX, serif', q(38), 1.55, false, 'soft', q(46));
      add('tr', data.translation, '400 ' + q(36) + 'px WPPoppins, WPPoppinsX, system-ui, sans-serif', q(36), 1.6, false, 'ink', q(36));
    } else {
      add('qt', data.translation, '700 ' + q(66) + 'px WPAmiriBold, WPAmiriBoldX, Georgia, serif', q(66), 1.38, false, 'ink', 0);
      if (withLatin) add('la', data.latin, 'italic 400 ' + q(38) + 'px WPAmiriLa, WPAmiriLaX, serif', q(38), 1.55, false, 'soft', q(40));
    }
    add('src', data.source, '600 ' + q(30) + 'px WPPoppinsSemi, WPPoppinsSemiX, system-ui, sans-serif', q(30), 1.5, false, 'accent', q(44));

    var total = 0;
    blocks.forEach(function (b, i) {
      total += (i ? b.gap : 0) + b.lines.length * b.lh;
    });
    return { blocks: blocks, total: total, widest: widest };
  }

  // Muat jika tinggi blok dan baris terlebar (mis. satu kata sangat panjang) masih di dalam area aman
  function fits(lay) {
    return lay.total <= MAX_H && lay.widest <= MAX_W + 1;
  }

  function shrink(withLatin, floor) {
    var s = 1;
    var lay = layout(s, withLatin);
    while (!fits(lay) && s > floor) {
      s = Math.max(floor, Math.round((s - 0.04) * 100) / 100);
      lay = layout(s, withLatin);
    }
    lay.scale = s;
    lay.fits = fits(lay);
    return lay;
  }

  function fit() {
    // 1) semua teks, huruf boleh mengecil sampai batas nyaman baca
    // 2) kalau masih tidak muat: buang baris Latin (tetap ada di halaman artikel), huruf utama tetap besar
    // 3) pilihan terakhir: huruf lebih kecil lagi supaya tidak ada teks yang keluar bingkai
    var options = data.latin ? [true, false] : [true];
    var lay;
    for (var i = 0; i < options.length; i++) {
      lay = shrink(options[i], MIN_SCALE);
      if (lay.fits) {
        lay.droppedLatin = !!data.latin && !options[i];
        return lay;
      }
    }
    var last = options[options.length - 1];
    lay = shrink(last, HARD_MIN);
    lay.droppedLatin = !!data.latin && !last;
    lay.overflow = !lay.fits;
    return lay;
  }

  /* ---------- menggambar ---------- */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ornament(cx, cy, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 130, cy); ctx.lineTo(cx - 20, cy);
    ctx.moveTo(cx + 20, cy); ctx.lineTo(cx + 130, cy);
    ctx.stroke();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }

  function draw() {
    var t = theme;
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, t.bg[0]);
    g.addColorStop(1, t.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var glow = ctx.createRadialGradient(W / 2, CENTER_Y, 60, W / 2, CENTER_Y, 900);
    glow.addColorStop(0, t.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = t.accent;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 3;
    roundRect(54, 54, W - 108, H - 108, 44);
    ctx.stroke();
    ctx.globalAlpha = 1;

    var lay = fit();
    var y = CENTER_Y - lay.total / 2;
    var arEnd = null;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    lay.blocks.forEach(function (b, i) {
      if (i) y += b.gap;
      if (i && lay.blocks[i - 1].kind === 'ar') arEnd = y - b.gap / 2;
      ctx.font = b.font;
      ctx.direction = b.rtl ? 'rtl' : 'ltr';
      ctx.fillStyle = t[b.color];
      b.lines.forEach(function (line) {
        ctx.fillText(line, W / 2, y + b.lh / 2);
        y += b.lh;
      });
    });
    if (arEnd !== null) ornament(W / 2, arEnd, t.accent);

    // alamat situs kecil di bawah (jauh dari tombol senter/kamera layar kunci)
    ctx.direction = 'ltr';
    ctx.font = '600 28px WPPoppinsSemi, WPPoppinsSemiX, system-ui, sans-serif';
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.9;
    ctx.fillText(data.site || '', W / 2, 1668);
    ctx.restore();

    return lay;
  }

  function showNote(lay) {
    var msg = '';
    if (lay.overflow) msg = I18n.t('wpOverflow');
    else if (lay.scale < MIN_SCALE) msg = I18n.t('wpTiny', { latin: lay.droppedLatin ? I18n.t('wpTinyLatin') : '' });
    else if (lay.droppedLatin) msg = I18n.t('wpDropped');
    else if (lay.scale < 0.7) msg = I18n.t('wpSmall');
    elNote.hidden = !msg;
    elNote.textContent = msg;
  }

  function render() {
    var token = ++renderToken;
    var lay = draw();
    showNote(lay);
    setActions(!lay.overflow);
    blobCache = null;
    canvas.toBlob(function (b) { if (token === renderToken) blobCache = b; }, 'image/png');
  }

  /* ---------- tombol ---------- */
  var fontsReady = Promise.resolve();

  // Unduh/bagikan hanya aktif kalau seluruh teks muat di gambar (jangan sebarkan gambar yang terpotong)
  function setActions(on) {
    elDownload.disabled = !on;
    elShare.disabled = !on;
  }

  // Tunggu font selesai dimuat dulu, supaya gambar yang diunduh tidak memakai font cadangan
  function getBlob() {
    return fontsReady.then(function () {
      if (blobCache) return blobCache;
      return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
    });
  }

  function fileName() { return (data.slug || 'wallpaper') + '-wallpaper.png'; }

  function caption() {
    var parts = [data.title];
    var body = data.translation || data.latin || '';
    if (body) parts.push(body + (data.source ? '\n— ' + data.source : ''));
    parts.push(I18n.t('wpReadMore') + data.url);
    return parts.join('\n\n');
  }

  function download() {
    getBlob().then(function (b) {
      if (!b) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    });
  }

  function canShareFiles() {
    try {
      if (!navigator.share || !navigator.canShare || !window.File) return false;
      return navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'a.png', { type: 'image/png' })] });
    } catch (e) {
      return false;
    }
  }

  THEMES.forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'wp-theme' + (t === theme ? ' active' : '');
    b.textContent = t.label;
    b.setAttribute('aria-pressed', t === theme ? 'true' : 'false');
    b.addEventListener('click', function () {
      theme = t;
      [].forEach.call(elThemes.children, function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      try { localStorage.setItem('maul_wp_theme', t.id); } catch (e) { /* abaikan */ }
      render();
    });
    elThemes.appendChild(b);
  });

  elDownload.addEventListener('click', download);

  elCaption.addEventListener('click', function () {
    var copy = window.MaulShare ? window.MaulShare.copy : function () { return Promise.resolve(false); };
    copy(caption()).then(function (ok) {
      if (window.MaulShare) window.MaulShare.flash(elCaption, I18n.t(ok ? 'copied' : 'copyFail'));
    });
  });

  if (canShareFiles()) {
    elShare.hidden = false;
    elShare.addEventListener('click', function () {
      getBlob().then(function (b) {
        var file = new File([b], fileName(), { type: 'image/png' });
        return navigator.share({ files: [file], title: data.title, text: caption() });
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // pengguna membatalkan
        download();
      });
    });
  }

  render();                                // gambar awal dengan font cadangan
  fontsReady = loadFonts().then(render, render); // gambar ulang setelah font Arab/Latin siap
})();

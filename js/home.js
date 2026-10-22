// Beranda: filter kategori, pencarian, dan paginasi dari /data/index.json
(function () {
  var grid = document.getElementById('postsGrid');
  var pagerEl = document.getElementById('paginationContainer');
  var search = document.getElementById('searchInput');
  var filterBox = document.getElementById('categoryFilter');
  if (!grid) return;

  var I = window.MaulI18n || { lang: 'id', t: function (k) { return k; }, type: function (x) { return x; } };
  var EN = I.lang === 'en';
  var PER = parseInt(grid.dataset.perPage, 10) || 12;
  var all = [];
  var state = { cat: 'all', page: 1, q: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Halaman Inggris: pakai judul/inti/alamat Inggris kalau ada; kalau belum diterjemahkan, tampil versi Indonesia (diberi tanda ID)
  function view(p) {
    if (!EN) return { title: p.title, core: p.core, url: p.url, date: p.date, untranslated: false };
    return p.en
      ? { title: p.en.title, core: p.en.core, url: p.en.url, date: p.dateEn || p.date, untranslated: false }
      : { title: p.title, core: p.core, url: p.url, date: p.dateEn || p.date, untranslated: true };
  }

  function card(p) {
    var v = view(p);
    var src = p.cover ? encodeURI('/' + p.cover) : placeholderCover(p.type);
    var desc = v.core ? esc(v.core.length > 90 ? v.core.slice(0, 90) + '...' : v.core) : '';
    return '<a href="' + esc(v.url) + '" class="post-card">' +
      '<img src="' + esc(src) + '" alt="' + esc(v.title) + '" class="post-card-cover" data-t="' + esc(p.type) + '" loading="lazy" decoding="async" onerror="coverFallback(this)" />' +
      '<div class="post-card-info">' +
      '<div class="post-card-top"><span class="post-card-badge">' + esc(I.type(p.type)) + (v.untranslated ? ' · ID' : '') + '</span>' +
      (p.readMin ? '<span class="post-card-time">⏱ ' + p.readMin + ' ' + esc(I.t('minShort')) + '</span>' : '') + '</div>' +
      '<h3 class="post-card-title">' + esc(v.title) + '</h3>' +
      (p.author ? '<p class="post-card-author">✍️ ' + esc(p.author) + '</p>' : '') +
      '<p class="post-card-desc">' + desc + '</p>' +
      '<div class="post-card-meta"><span>📅 ' + esc(v.date) + '</span><span style="color: var(--accent-light); font-weight: 500;">' + esc(I.t('readMore')) + '</span></div>' +
      '</div></a>';
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return all.filter(function (p) {
      if (state.cat !== 'all' && p.type !== state.cat) return false;
      if (!q) return true;
      var hay = (p.title + ' ' + (p.core || '') + ' ' + (p.en ? p.en.title + ' ' + (p.en.core || '') + ' ' : '') + (p.author || '') + ' ' + (p.categories || []).join(' ')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function pagerHtml(total) {
    if (total <= 1) return '';
    var set = {}, list = [];
    [1, total, state.page - 1, state.page, state.page + 1].forEach(function (n) {
      if (n >= 1 && n <= total && !set[n]) { set[n] = 1; list.push(n); }
    });
    list.sort(function (a, b) { return a - b; });
    var html = '<button class="page-btn" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? ' disabled' : '') + '>← Prev</button>';
    var last = 0;
    list.forEach(function (n) {
      if (n - last > 1) html += '<span class="page-gap">…</span>';
      html += '<button class="page-btn' + (n === state.page ? ' active' : '') + '" data-page="' + n + '">' + n + '</button>';
      last = n;
    });
    html += '<button class="page-btn" data-page="' + (state.page + 1) + '"' + (state.page === total ? ' disabled' : '') + '>Next →</button>';
    return html;
  }

  function render() {
    var list = filtered();
    var total = Math.max(1, Math.ceil(list.length / PER));
    if (state.page > total) state.page = total;
    if (!list.length) {
      grid.innerHTML = '<p style="color: var(--text-muted);">' + esc(I.t('noPosts')) + '</p>';
      pagerEl.innerHTML = '';
      return;
    }
    grid.innerHTML = list.slice((state.page - 1) * PER, state.page * PER).map(card).join('');
    pagerEl.innerHTML = pagerHtml(total);
    if (window.MaulReading) window.MaulReading.markCards(grid); // tanda ✓ untuk bacaan yang sudah selesai
  }

  filterBox.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBox.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.cat = btn.dataset.cat;
    state.page = 1;
    render();
  });

  var timer;
  search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = search.value; state.page = 1; render(); }, 150);
  });

  pagerEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.page-btn[data-page]');
    if (!btn || btn.disabled) return;
    state.page = parseInt(btn.dataset.page, 10);
    render();
    document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
  });

  fetch(grid.dataset.index)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      all = data.filter(function (p) { return p.status !== 'archived'; });
      render();
      if (window.MaulReading) window.MaulReading.reconcile(data); // buang bacaan yang sudah dihapus/diarsipkan
    })
    .catch(function () { /* tetap tampilkan kartu statis dari server */ });
})();

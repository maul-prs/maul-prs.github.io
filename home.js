// Beranda: filter kategori, pencarian, dan paginasi dari /data/index.json
(function () {
  var grid = document.getElementById('postsGrid');
  var pagerEl = document.getElementById('paginationContainer');
  var search = document.getElementById('searchInput');
  var filterBox = document.getElementById('categoryFilter');
  if (!grid) return;

  var PER = parseInt(grid.dataset.perPage, 10) || 12;
  var all = [];
  var state = { cat: 'all', page: 1, q: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function card(p) {
    var src = p.cover ? encodeURI('/' + p.cover) : placeholderCover(p.type);
    var desc = p.core ? esc(p.core.length > 90 ? p.core.slice(0, 90) + '...' : p.core) : '';
    return '<a href="' + esc(p.url) + '" class="post-card">' +
      '<img src="' + esc(src) + '" alt="' + esc(p.title) + '" class="post-card-cover" data-t="' + esc(p.type) + '" loading="lazy" decoding="async" onerror="coverFallback(this)" />' +
      '<div class="post-card-info">' +
      '<span class="post-card-badge">' + esc(p.type) + '</span>' +
      '<h3 class="post-card-title">' + esc(p.title) + '</h3>' +
      '<p class="post-card-desc">' + desc + '</p>' +
      '<div class="post-card-meta"><span>📅 ' + esc(p.date) + '</span><span style="color: var(--accent-light); font-weight: 500;">Baca Selengkapnya →</span></div>' +
      '</div></a>';
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return all.filter(function (p) {
      if (state.cat !== 'all' && p.type !== state.cat) return false;
      if (!q) return true;
      var hay = (p.title + ' ' + (p.core || '') + ' ' + (p.author || '') + ' ' + (p.categories || []).join(' ')).toLowerCase();
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
      grid.innerHTML = '<p style="color: var(--text-muted);">Tidak ada postingan yang ditemukan.</p>';
      pagerEl.innerHTML = '';
      return;
    }
    grid.innerHTML = list.slice((state.page - 1) * PER, state.page * PER).map(card).join('');
    pagerEl.innerHTML = pagerHtml(total);
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

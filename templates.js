'use strict';
/* Template HTML website. Ubah tampilan header/footer/kartu di file ini. */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const emojiFor = (t = '') =>
  /book/i.test(t) ? '📚' : /dzikir|do.a/i.test(t) ? '🤲' : /quote|nasehat/i.test(t) ? '💡' : /inspirasi/i.test(t) ? '✨' : '📝';

function placeholderUri(type) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3020"/><stop offset="1" stop-color="#032a18"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><text x="150" y="215" font-size="96" text-anchor="middle">' +
    emojiFor(type) +
    '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Script kecil di <head>: placeholder cover, fallback gambar, dan mode fokus (tanpa "kedip")
const INLINE_JS = `
window.placeholderCover=function(t){t=t||'';var e=/book/i.test(t)?'📚':/dzikir|do.a/i.test(t)?'🤲':/quote|nasehat/i.test(t)?'💡':/inspirasi/i.test(t)?'✨':'📝';var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3020"/><stop offset="1" stop-color="#032a18"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><text x="150" y="215" font-size="96" text-anchor="middle">'+e+'</text></svg>';return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)};
window.coverFallback=function(i){if(!i.dataset.fb){i.dataset.fb='1';i.src=placeholderCover(i.dataset.t)}else{i.style.display='none';if(i.parentElement)i.parentElement.classList.add('no-cover')}};
try{if(localStorage.getItem('maul_focus_mode')==='enabled')document.documentElement.classList.add('focus-mode')}catch(e){}
`.trim();

function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

/* ---------- Kerangka halaman ---------- */
function layout(o) {
  const cfg = o.cfg;
  const v = cfg.assetVersion;
  const ogImage = o.ogImage || `${cfg.siteUrl}/${cfg.ogDefaultImage}`;
  const card = o.twitterCard || 'summary_large_image';
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(o.title)}</title>
    <meta name="description" content="${esc(o.description)}" />
    <link rel="canonical" href="${esc(o.canonical)}" />
${o.noindex ? '    <meta name="robots" content="noindex" />\n' : ''}${cfg.googleSiteVerification ? `    <meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}" />\n` : ''}    <meta property="og:site_name" content="${esc(cfg.siteName)}" />
    <meta property="og:locale" content="${esc(cfg.locale)}" />
    <meta property="og:type" content="${o.ogType || 'website'}" />
    <meta property="og:title" content="${esc(o.ogTitle || o.title)}" />
    <meta property="og:description" content="${esc(o.description)}" />
    <meta property="og:url" content="${esc(o.canonical)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
${o.published ? `    <meta property="article:published_time" content="${esc(o.published)}" />\n` : ''}    <meta name="twitter:card" content="${card}" />
    <meta name="twitter:title" content="${esc(o.ogTitle || o.title)}" />
    <meta name="twitter:description" content="${esc(o.description)}" />
    <meta name="twitter:image" content="${esc(ogImage)}" />
    <link rel="alternate" type="application/rss+xml" title="${esc(cfg.siteName)}" href="/feed.xml" />
    <link rel="icon" href="/assets/profile.png" />
    <link rel="stylesheet" href="/css/style.css?v=${v}" />
${(o.css || []).map((c) => `    <link rel="stylesheet" href="${c}?v=${v}" />`).join('\n')}
    <script>${INLINE_JS}</script>
${o.jsonld ? `    <script type="application/ld+json">${jsonLd(o.jsonld)}</script>\n` : ''}  </head>
  <body>
${o.body}
    <script src="/js/common.js?v=${v}" defer></script>
${(o.scripts || []).map((s) => `    <script src="${s}?v=${v}" defer></script>`).join('\n')}
  </body>
</html>
`;
}

/* ---------- Header & footer ---------- */
function header(cfg, variant) {
  const brand = `<a class="brand" href="/">
          <img class="brand-photo" src="/assets/profile.png" alt="${esc(cfg.siteName)}" onerror="this.style.display='none'" />
          <span>${esc(cfg.siteName)}</span>
        </a>`;
  if (variant === 'article') {
    return `    <header class="site-header">
      <div class="container nav" style="display: flex; justify-content: space-between; align-items: center;">
        ${brand}
        <div style="display: flex; align-items: center; gap: 12px;">
          <button id="focusBtn" class="focus-toggle-btn" type="button">👁️ <span id="focusBtnText">Mode Fokus</span></button>
          <a href="/" class="back-link" style="color: var(--accent-light, #34d399); text-decoration: none; font-size: 13px; font-weight: 500;">← Beranda</a>
        </div>
      </div>
    </header>`;
  }
  return `    <header class="site-header">
      <div class="container nav">
        ${brand}
        <button class="menu-toggle" type="button" aria-label="Toggle Menu"><span></span><span></span><span></span></button>
        <nav id="navMenu">
          <a href="/#categories">Categories</a>
          <a href="/arsip/">Arsip</a>
          <a href="/#youtube">YouTube</a>
          <a href="/#about">About</a>
        </nav>
      </div>
    </header>`;
}

function footer(cfg) {
  return `    <footer class="site-footer">
      <div class="container">
        <span>© ${new Date().getFullYear()} ${esc(cfg.siteName)} — ${esc(cfg.tagline)}</span>
        <span><a href="/arsip/">Semua tulisan</a> · <a href="/feed.xml">RSS</a></span>
      </div>
    </footer>`;
}

/* ---------- Kartu & paginasi ---------- */
function card(p) {
  const src = p.cover ? encodeURI('/' + p.cover) : placeholderUri(p.type);
  const desc = p.core ? esc(p.core.length > 90 ? p.core.slice(0, 90) + '...' : p.core) : '';
  return `<a href="${esc(p.url)}" class="post-card">
              <img src="${esc(src)}" alt="${esc(p.title)}" class="post-card-cover" data-t="${esc(p.type)}" loading="lazy" decoding="async" onerror="coverFallback(this)" />
              <div class="post-card-info">
                <span class="post-card-badge">${esc(p.type)}</span>
                <h3 class="post-card-title">${esc(p.title)}</h3>
${p.author ? `                <p class="post-card-author">✍️ ${esc(p.author)}</p>\n` : ''}                <p class="post-card-desc">${desc}</p>
                <div class="post-card-meta">
                  <span>📅 ${esc(p.date)}</span>
                  <span style="color: var(--accent-light); font-weight: 500;">Baca Selengkapnya →</span>
                </div>
              </div>
            </a>`;
}

function pager(current, total, hrefFor) {
  if (total <= 1) return '';
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const list = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  let html = '';
  if (current > 1) html += `<a class="page-btn" href="${hrefFor(current - 1)}" rel="prev">← Prev</a>`;
  let last = 0;
  for (const n of list) {
    if (n - last > 1) html += '<span class="page-gap">…</span>';
    html += n === current ? `<span class="page-btn active">${n}</span>` : `<a class="page-btn" href="${hrefFor(n)}">${n}</a>`;
    last = n;
  }
  if (current < total) html += `<a class="page-btn" href="${hrefFor(current + 1)}" rel="next">Next →</a>`;
  return `<nav class="pagination" aria-label="Halaman">${html}</nav>`;
}

/* ---------- Beranda ---------- */
// Video di beranda: isi youtubeVideoId (ID atau link video) untuk satu video,
// atau biarkan kosong untuk memakai youtubePlaylistId (playlist).
function youtubeEmbedUrl(cfg) {
  const raw = String(cfg.youtubeVideoId || '').trim();
  const m = /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/.exec(raw);
  const id = m ? m[1] : /^[\w-]{11}$/.test(raw) ? raw : '';
  return id
    ? `https://www.youtube.com/embed/${id}`
    : `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(cfg.youtubePlaylistId || '')}`;
}

function homePage(cfg, data) {
  const filters = ['Book Summary', 'Quote & Nasehat', "Dzikir & Do'a", 'Cerita Inspirasi', ...data.extraTypes];
  const filterBtns = filters
    .map((t) => `<button class="filter-btn" type="button" data-cat="${esc(t)}">${emojiFor(t)} ${esc(t)}</button>`)
    .join('\n            ');
  const body = `${header(cfg, 'home')}

    <main>
      <section id="resumeStrip" class="resume-strip container" aria-label="Lanjutkan membaca" hidden></section>
      <script src="/js/reading.js?v=${cfg.assetVersion}"></script>

      <section class="hero container">
        <p class="eyebrow">${esc(cfg.siteName.toUpperCase())}</p>
        <h1>Notes from <em>Becoming.</em></h1>
        <p class="hero-copy">Catatan tentang iman, kehidupan, buku, dan proses menjadi manusia yang lebih baik.</p>
        <div class="hero-actions">
          <a class="button" href="#categories">Explore writing</a>
          <a class="text-link" href="#youtube">Watch on YouTube →</a>
        </div>
      </section>

      <section id="categories" class="section container">
        <div class="category-search-wrapper">
          <div class="category-filter" id="categoryFilter">
            <button class="filter-btn active" type="button" data-cat="all">Semua</button>
            ${filterBtns}
          </div>
          <input id="searchInput" class="search-input" type="search" placeholder="Cari tulisan atau buku..." aria-label="Cari tulisan" />
        </div>

        <div class="posts-grid" id="postsGrid" data-index="/data/index.json?v=${cfg.assetVersion}" data-per-page="${cfg.homePerPage}">
          ${data.posts.map(card).join('\n          ')}
        </div>

        <div class="pagination" id="paginationContainer">
          <a class="page-btn" href="/arsip/">Lihat semua tulisan →</a>
        </div>
      </section>

      <section id="youtube" class="section container">
        <div class="info-box yt-box">
          <div>
            <p class="eyebrow" style="color: var(--accent-light); margin: 0 0 6px 0;">YOUTUBE</p>
            <h2 style="color: #fff; margin: 0 0 10px 0; font-size: 26px;">Konten ${esc(cfg.siteName)}</h2>
            <p style="color: var(--text-muted); margin: 0; line-height: 1.6; font-size: 14px;">Website ini menjadi rumah untuk tulisan dan catatan yang melengkapi konten video ${esc(cfg.siteName)}.</p>
          </div>
          <div style="aspect-ratio: 16/9; width: 100%; border-radius: 8px; overflow: hidden; background: #032a18; border: 1px solid var(--border-color);">
            <iframe src="${esc(youtubeEmbedUrl(cfg))}" title="YouTube video player" loading="lazy" style="width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
          </div>
        </div>
      </section>

      <section id="about" class="section container" style="margin-bottom: 60px;">
        <div class="info-box">
          <p class="eyebrow">ABOUT</p>
          <h2 style="color: #fff; margin: 0 0 10px 0; font-size: 26px;">Selamat datang di ${esc(cfg.siteName)}.</h2>
          <p style="color: var(--text-muted); margin: 0;">Tempat untuk menyimpan ide, pelajaran, nasihat, dan rangkuman buku yang ingin saya bawa lebih jauh dari sekadar satu video.</p>
        </div>
      </section>
    </main>

${footer(cfg)}`;

  return layout({
    cfg,
    title: `${cfg.siteName} — ${cfg.tagline}`,
    description: cfg.description,
    canonical: cfg.siteUrl + '/',
    body,
    scripts: ['/js/home.js'],
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: cfg.siteName,
      url: cfg.siteUrl + '/',
      description: cfg.description,
      inLanguage: 'id',
    },
  });
}

/* ---------- Halaman daftar (arsip & kategori) ---------- */
function listPage(cfg, o) {
  const body = `${header(cfg, 'home')}

    <main class="container archive-main">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Beranda</a> / ${o.crumb}</nav>
      <h1 class="archive-title">${esc(o.heading)}</h1>
      <p class="archive-intro">${esc(o.intro)}</p>
      <div class="posts-grid">
        ${o.posts.map(card).join('\n        ')}
      </div>
      ${o.pagerHtml}
    </main>

${footer(cfg)}`;
  return layout({
    cfg,
    title: o.title,
    description: o.intro,
    canonical: cfg.siteUrl + o.path,
    scripts: ['/js/reading.js'],
    body,
  });
}

/* ---------- Halaman artikel ---------- */
function articlePage(cfg, o) {
  const p = o.post;
  const bd = p.bookData || {};
  const coverSrc = p.cover ? encodeURI('/' + p.cover) : placeholderUri(p.type);
  const author = bd.bookAuthor
    ? `<p class="article-author">✍️ Penulis: ${esc(bd.bookAuthor)}${bd.bookYear ? ` (${esc(bd.bookYear)})` : ''}</p>`
    : '';
  const toc = o.toc.length
    ? `      <div class="sidebar-right-sticky">
        <aside id="tocSidebarCard" class="toc-card-container">
          <h3 class="sidebar-title">📖 Bab &amp; Sub-Judul</h3>
          <div class="toc-scroll-area">
            <ul class="toc-list">
${o.toc.map((t) => `              <li><a href="#${esc(t.id)}"><span class="toc-bullet">📍</span><span>${esc(t.text)}</span></a></li>`).join('\n')}
            </ul>
          </div>
        </aside>
      </div>`
    : '      <div class="sidebar-right-sticky"></div>';
  const related = o.related.length
    ? `        <section class="related-box">
          <h2>Baca juga</h2>
          <ul>
${o.related.map((r) => `            <li><a href="${esc(r.url)}">${esc(r.title)}</a> <span class="related-type">${esc(r.type)}</span></li>`).join('\n')}
          </ul>
        </section>`
    : '';

  // Posisi baca hanya dilacak untuk Book Summary (bacaan panjang yang sering dilanjutkan nanti)
  const tracked = /book/i.test(p.type);
  const trackAttrs = tracked
    ? ` data-track="1" data-slug="${esc(p.slug)}" data-url="${esc(p.url)}" data-title="${esc(p.title)}" data-cover="${esc(p.cover || '')}" data-type="${esc(p.type)}"`
    : '';
  const progressUi = tracked
    ? `    <div class="read-progress" id="readProgress" aria-hidden="true"><span></span></div>
    <div class="read-pct" id="readPct" aria-hidden="true"></div>
`
    : '';

  const body = `${progressUi}${header(cfg, 'article')}

    <main class="container article-layout">
      <div class="sidebar-left-sticky">
        <aside class="category-card-container">
          <h3 class="sidebar-title">📑 Kategori &amp; Buku</h3>
          <div class="category-scroll-area" id="accordionContainer" data-slug="${esc(p.slug)}" data-tags="${esc(JSON.stringify(p.categories))}" data-index="/data/index.json?v=${cfg.assetVersion}">
            <p style="color: #777; font-size: 12px;">Memuat menu...</p>
          </div>
        </aside>
      </div>

      <section class="main-article-card">
        <div id="articleHeroBox" class="article-hero-box">
          <img id="articleCover" class="article-hero-cover" src="${esc(coverSrc)}" alt="Cover ${esc(p.title)}" data-t="${esc(p.type)}" decoding="async" onerror="coverFallback(this)" />
          <div class="article-hero-info">
            <a class="article-badge-tag" href="${esc(p.typeUrl)}">${esc(p.type)}</a>
            <h1 class="article-title-sub">${esc(p.title)}</h1>
            ${author}
            <p class="article-core-desc">${esc(p.core)}</p>
            <div class="article-date-row">📅 Tanggal: <strong>${esc(p.date)}</strong></div>
          </div>
        </div>

        <article id="articleContent" class="article-content"${trackAttrs}>
${o.bodyHtml}
        </article>
${related}
      </section>

${toc}
    </main>

${footer(cfg)}`;

  const url = cfg.siteUrl + p.url;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: o.description,
    image: [o.ogImage],
    datePublished: p.dateISO,
    dateModified: p.dateISO,
    inLanguage: 'id',
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: cfg.author },
    articleSection: p.type,
  };
  if (bd.bookAuthor && /book/i.test(p.type)) {
    ld.about = { '@type': 'Book', name: bd.bookTitle || p.title, author: { '@type': 'Person', name: bd.bookAuthor } };
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: cfg.siteUrl + '/' },
      { '@type': 'ListItem', position: 2, name: p.type, item: cfg.siteUrl + p.typeUrl },
      { '@type': 'ListItem', position: 3, name: p.title, item: url },
    ],
  };

  return layout({
    cfg,
    title: `${p.title} — ${cfg.siteName}`,
    ogTitle: p.title,
    description: o.description,
    canonical: url,
    ogType: 'article',
    ogImage: o.ogImage,
    twitterCard: p.cover ? 'summary' : 'summary_large_image',
    published: p.dateISO,
    css: ['/css/article.css'],
    scripts: tracked ? ['/js/reading.js', '/js/article.js'] : ['/js/article.js'],
    jsonld: [ld, crumbs],
    body,
  });
}

/* ---------- 404 & redirect link lama ---------- */
function notFoundPage(cfg) {
  const body = `${header(cfg, 'home')}
    <main class="container" style="padding: 80px 0; text-align: center;">
      <h1 style="color:#fff;">Halaman tidak ditemukan</h1>
      <p style="color: var(--text-muted);">Tulisan yang kamu cari mungkin sudah dipindahkan.</p>
      <p><a class="button" href="/">Kembali ke beranda</a></p>
    </main>
${footer(cfg)}`;
  return layout({ cfg, title: `Halaman tidak ditemukan — ${cfg.siteName}`, description: cfg.description, canonical: cfg.siteUrl + '/', noindex: true, body });
}

function legacyRedirectPage(cfg) {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8" /><meta name="robots" content="noindex" />
<title>Mengalihkan…</title></head>
<body style="background:#020c06;color:#d4f0dc;font-family:sans-serif;padding:40px;">
<p>Mengalihkan ke halaman artikel…</p>
<script>
(function(){
  var id=new URLSearchParams(location.search).get('id');
  if(!id){location.replace('/');return;}
  fetch('/data/index.json?v=${cfg.assetVersion}').then(function(r){return r.json()}).then(function(list){
    var p=list.filter(function(x){return String(x.id)===String(id)||x.slug===id})[0];
    location.replace(p&&p.url?p.url:'/');
  }).catch(function(){location.replace('/')});
})();
</script></body></html>
`;
}

module.exports = { esc, emojiFor, layout, homePage, listPage, articlePage, notFoundPage, legacyRedirectPage, pager, card };
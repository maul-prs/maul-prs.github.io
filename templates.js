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
try{var _l=document.documentElement.lang,_p=localStorage.getItem('maul_lang');if((_p==='id'||_p==='en')&&_p!==_l){var _a=document.querySelector('link[rel=alternate][hreflang='+_p+']');if(_a)location.replace(new URL(_a.href).pathname+location.search+location.hash)}}catch(e){}
`.trim();

function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

/* ---------- Bahasa (id / en) ---------- */
// Teks bawaan situs = Indonesia. Versi Inggris dibuat hanya untuk artikel yang punya terjemahan.
const TYPE_EN = { 'Quote & Nasehat': 'Quotes & Advice', "Dzikir & Do'a": "Dhikr & Du'a", 'Cerita Inspirasi': 'Inspiring Stories' };
const typeLabel = (t, lang) => (lang === 'en' && TYPE_EN[t]) || t;
const DEFAULT_DESC_EN = 'Notes on faith, life, books, and personal growth.';

const STR = {
  id: {
    home: 'Beranda',
    back: '← Beranda',
    focus: 'Mode Fokus',
    readMore: 'Baca Selengkapnya →',
    allPosts: 'Semua tulisan',
    allPostsTitle: 'Semua Tulisan',
    seeAll: 'Lihat semua tulisan →',
    all: 'Semua',
    search: 'Cari tulisan atau buku...',
    searchAria: 'Cari tulisan',
    heroCopy: 'Catatan tentang iman, kehidupan, buku, dan proses menjadi manusia yang lebih baik.',
    yt: (n) => `Konten ${n}`,
    ytText: (n) => `Website ini menjadi rumah untuk tulisan dan catatan yang melengkapi konten video ${n}.`,
    welcome: (n) => `Selamat datang di ${n}.`,
    aboutText: 'Tempat untuk menyimpan ide, pelajaran, nasihat, dan rangkuman buku yang ingin saya bawa lebih jauh dari sekadar satu video.',
    author: 'Penulis:',
    date: 'Tanggal:',
    share: 'Bagikan:',
    shareBtn: '📤 Bagikan',
    copyLink: '🔗 Salin tautan',
    related: 'Baca juga',
    catTitle: '📑 Kategori &amp; Buku',
    tocTitle: '📖 Bab &amp; Sub-Judul',
    loading: 'Memuat menu...',
    cover: 'Cover',
    wpPreview: 'Pratinjau wallpaper',
    wpHint: 'Jadikan wallpaper HP, atau bagikan ke WhatsApp dan media sosial.',
    wpColors: 'Pilih warna',
    wpShare: '📤 Bagikan wallpaper',
    wpDownload: '⬇️ Unduh gambar',
    wpCopy: '📋 Salin teks + tautan',
    langLabel: 'Bahasa',
    noEn: 'Versi bahasa Inggris belum tersedia',
    minShort: 'mnt',
    minRead: (n) => `${n} menit`,
    moreTags: (n) => `+${n} lagi`,
    tagsAria: 'Kategori buku',
  },
  en: {
    home: 'Home',
    back: '← Home',
    focus: 'Focus Mode',
    readMore: 'Read more →',
    allPosts: 'All posts',
    allPostsTitle: 'All Posts',
    seeAll: 'See all posts →',
    all: 'All',
    search: 'Search posts or books...',
    searchAria: 'Search posts',
    heroCopy: 'Notes on faith, life, books, and the process of becoming a better person.',
    yt: (n) => `${n} Content`,
    ytText: (n) => `This website is a home for the writing and notes that complement ${n}'s video content.`,
    welcome: (n) => `Welcome to ${n}.`,
    aboutText: 'A place to keep ideas, lessons, advice, and book summaries that I want to carry further than a single video.',
    author: 'Author:',
    date: 'Date:',
    share: 'Share:',
    shareBtn: '📤 Share',
    copyLink: '🔗 Copy link',
    related: 'Related reading',
    catTitle: '📑 Categories &amp; Books',
    tocTitle: '📖 Chapters &amp; Sections',
    loading: 'Loading menu...',
    cover: 'Cover of',
    wpPreview: 'Wallpaper preview',
    wpHint: 'Use it as your phone wallpaper, or share it on WhatsApp and social media.',
    wpColors: 'Choose a color',
    wpShare: '📤 Share wallpaper',
    wpDownload: '⬇️ Download image',
    wpCopy: '📋 Copy text + link',
    langLabel: 'Language',
    noEn: 'English version not available yet',
    minShort: 'min',
    minRead: (n) => `${n} min read`,
    moreTags: (n) => `+${n} more`,
    tagsAria: 'Book categories',
  },
};

// Tombol ID | EN. alt = { id: '/path/', en: '/path/' | null }. Tanpa alt (mis. halaman 404) tombol tidak ditampilkan.
function langSwitch(lang, alt) {
  if (!alt || !alt.id) return '';
  const S = STR[lang];
  const btn = (l, label) => {
    if (l === lang) return `<a class="lang-btn active" href="${esc(alt[l])}" lang="${l}" data-lang="${l}" aria-current="true">${label}</a>`;
    if (!alt[l]) return `<span class="lang-btn disabled" title="${esc(S.noEn)}" aria-disabled="true">${label}</span>`;
    return `<a class="lang-btn" href="${esc(alt[l])}" hreflang="${l}" lang="${l}" data-lang="${l}">${label}</a>`;
  };
  return `<div class="lang-switch" role="group" aria-label="${esc(S.langLabel)}">${btn('id', 'ID')}${btn('en', 'EN')}</div>`;
}

/* ---------- Kerangka halaman ---------- */
function layout(o) {
  const cfg = o.cfg;
  const v = cfg.assetVersion;
  const ogImage = o.ogImage || `${cfg.siteUrl}/${cfg.ogDefaultImage}`;
  const card = o.twitterCard || 'summary_large_image';
  const lang = o.lang || 'id';
  const alt = o.alt || {};
  const pair = !!(alt.id && alt.en);
  const hreflang = pair
    ? `    <link rel="alternate" hreflang="id" href="${esc(cfg.siteUrl + alt.id)}" />\n    <link rel="alternate" hreflang="en" href="${esc(cfg.siteUrl + alt.en)}" />\n    <link rel="alternate" hreflang="x-default" href="${esc(cfg.siteUrl + alt.id)}" />\n`
    : '';
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(o.title)}</title>
    <meta name="description" content="${esc(o.description)}" />
    <link rel="canonical" href="${esc(o.canonical)}" />
${hreflang}${o.noindex ? '    <meta name="robots" content="noindex" />\n' : ''}${cfg.googleSiteVerification ? `    <meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}" />\n` : ''}    <meta property="og:site_name" content="${esc(cfg.siteName)}" />
    <meta property="og:locale" content="${esc(lang === 'en' ? 'en_US' : cfg.locale)}" />
${pair ? `    <meta property="og:locale:alternate" content="${esc(lang === 'en' ? cfg.locale : 'en_US')}" />\n` : ''}    <meta property="og:type" content="${o.ogType || 'website'}" />
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
    <script src="/js/i18n.js?v=${v}"></script>
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
function header(cfg, variant, ctx = {}) {
  const lang = ctx.lang || 'id';
  const S = STR[lang];
  const home = lang === 'en' ? '/en/' : '/';
  const sw = langSwitch(lang, ctx.alt);
  const brand = `<a class="brand" href="${home}">
          <img class="brand-photo" src="/assets/profile.png" alt="${esc(cfg.siteName)}" onerror="this.style.display='none'" />
          <span>${esc(cfg.siteName)}</span>
        </a>`;
  if (variant === 'article') {
    return `    <header class="site-header">
      <div class="container nav" style="display: flex; justify-content: space-between; align-items: center;">
        ${brand}
        <div style="display: flex; align-items: center; gap: 12px;">
          ${sw ? sw + '\n          ' : ''}<button id="focusBtn" class="focus-toggle-btn" type="button">👁️ <span id="focusBtnText">${S.focus}</span></button>
          <a href="${home}" class="back-link" style="color: var(--accent-light, #34d399); text-decoration: none; font-size: 13px; font-weight: 500;">${S.back}</a>
        </div>
      </div>
    </header>`;
  }
  return `    <header class="site-header">
      <div class="container nav">
        ${brand}
        <button class="menu-toggle" type="button" aria-label="Toggle Menu"><span></span><span></span><span></span></button>
        <div class="nav-right">
          <nav id="navMenu">
            <a href="${home}#categories">Categories</a>
            <a href="${home}#youtube">YouTube</a>
            <a href="${home}#about">About</a>
          </nav>
          ${sw}
        </div>
      </div>
    </header>`;
}

function footer(cfg, lang = 'id') {
  const S = STR[lang];
  return `    <footer class="site-footer">
      <div class="container">
        <span>© ${new Date().getFullYear()} ${esc(cfg.siteName)} — ${esc(cfg.tagline)}</span>
        <span><a href="${lang === 'en' ? '/en/arsip/' : '/arsip/'}">${S.allPosts}</a> · <a href="/feed.xml">RSS</a></span>
      </div>
    </footer>`;
}

/* ---------- Kartu & paginasi ---------- */
function card(p, lang = 'id') {
  const S = STR[lang];
  const src = p.cover ? encodeURI('/' + p.cover) : placeholderUri(p.type);
  const desc = p.core ? esc(p.core.length > 90 ? p.core.slice(0, 90) + '...' : p.core) : '';
  return `<a href="${esc(p.url)}" class="post-card">
              <img src="${esc(src)}" alt="${esc(p.title)}" class="post-card-cover" data-t="${esc(p.type)}" loading="lazy" decoding="async" onerror="coverFallback(this)" />
              <div class="post-card-info">
                <div class="post-card-top"><span class="post-card-badge">${esc(typeLabel(p.type, lang))}${p.untranslated ? ' · ID' : ''}</span>${p.readMin ? `<span class="post-card-time">⏱ ${p.readMin} ${S.minShort}</span>` : ''}</div>
                <h3 class="post-card-title">${esc(p.title)}</h3>
${p.author ? `                <p class="post-card-author">✍️ ${esc(p.author)}</p>\n` : ''}                <p class="post-card-desc">${desc}</p>
                <div class="post-card-meta">
                  <span>📅 ${esc(p.date)}</span>
                  <span style="color: var(--accent-light); font-weight: 500;">${S.readMore}</span>
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

function homePage(cfg, data, lang = 'id') {
  const S = STR[lang];
  const filters = ['Book Summary', 'Quote & Nasehat', "Dzikir & Do'a", 'Cerita Inspirasi', ...data.extraTypes];
  const filterBtns = filters
    .map((t) => `<button class="filter-btn" type="button" data-cat="${esc(t)}">${emojiFor(t)} ${esc(typeLabel(t, lang))}</button>`)
    .join('\n            ');
  const body = `${header(cfg, 'home', { lang, alt: data.alt })}

    <main>
      <section id="resumeStrip" class="resume-strip container" aria-label="Lanjutkan membaca" hidden></section>
      <script src="/js/reading.js?v=${cfg.assetVersion}"></script>

      <section class="hero container">
        <p class="eyebrow">${esc(cfg.siteName.toUpperCase())}</p>
        <h1>Notes from <em>Becoming.</em></h1>
        <p class="hero-copy">${S.heroCopy}</p>
        <div class="hero-actions">
          <a class="button" href="#categories">Explore writing</a>
          <a class="text-link" href="#youtube">Watch on YouTube →</a>
        </div>
      </section>

      <section id="categories" class="section container">
        <div class="category-search-wrapper">
          <div class="category-filter" id="categoryFilter">
            <button class="filter-btn active" type="button" data-cat="all">${S.all}</button>
            ${filterBtns}
          </div>
          <input id="searchInput" class="search-input" type="search" placeholder="${S.search}" aria-label="${S.searchAria}" />
        </div>

        <div class="posts-grid" id="postsGrid" data-index="/data/index.json?v=${cfg.assetVersion}" data-per-page="${cfg.homePerPage}">
          ${data.posts.map((p) => card(p, lang)).join('\n          ')}
        </div>

        <div class="pagination" id="paginationContainer">
          <a class="page-btn" href="${lang === 'en' ? '/en/arsip/' : '/arsip/'}">${S.seeAll}</a>
        </div>
      </section>

      <section id="youtube" class="section container">
        <div class="info-box yt-box">
          <div>
            <p class="eyebrow" style="color: var(--accent-light); margin: 0 0 6px 0;">YOUTUBE</p>
            <h2 style="color: #fff; margin: 0 0 10px 0; font-size: 26px;">${S.yt(esc(cfg.siteName))}</h2>
            <p style="color: var(--text-muted); margin: 0; line-height: 1.6; font-size: 14px;">${S.ytText(esc(cfg.siteName))}</p>
          </div>
          <div style="aspect-ratio: 16/9; width: 100%; border-radius: 8px; overflow: hidden; background: #032a18; border: 1px solid var(--border-color);">
            <iframe src="${esc(youtubeEmbedUrl(cfg))}" title="YouTube video player" loading="lazy" style="width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
          </div>
        </div>
      </section>

      <section id="about" class="section container" style="margin-bottom: 60px;">
        <div class="info-box">
          <p class="eyebrow">ABOUT</p>
          <h2 style="color: #fff; margin: 0 0 10px 0; font-size: 26px;">${S.welcome(esc(cfg.siteName))}</h2>
          <p style="color: var(--text-muted); margin: 0;">${S.aboutText}</p>
        </div>
      </section>
    </main>

${footer(cfg, lang)}`;

  const description = lang === 'en' ? cfg.descriptionEn || DEFAULT_DESC_EN : cfg.description;
  const homePath = lang === 'en' ? '/en/' : '/';
  return layout({
    cfg,
    lang,
    alt: data.alt,
    title: `${cfg.siteName} — ${cfg.tagline}`,
    description,
    canonical: cfg.siteUrl + homePath,
    body,
    scripts: ['/js/home.js'],
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: cfg.siteName,
      url: cfg.siteUrl + homePath,
      description,
      inLanguage: lang,
    },
  });
}

/* ---------- Halaman daftar (arsip & kategori) ---------- */
function listPage(cfg, o) {
  const lang = o.lang || 'id';
  const S = STR[lang];
  const body = `${header(cfg, 'home', { lang, alt: o.alt })}

    <main class="container archive-main">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${lang === 'en' ? '/en/' : '/'}">${S.home}</a> / ${o.crumb}</nav>
      <h1 class="archive-title">${esc(o.heading)}</h1>
      <p class="archive-intro">${esc(o.intro)}</p>
      <div class="posts-grid">
        ${o.posts.map((p) => card(p, lang)).join('\n        ')}
      </div>
      ${o.pagerHtml}
    </main>

${footer(cfg, lang)}`;
  return layout({
    cfg,
    lang,
    alt: o.alt,
    title: o.title,
    description: o.intro,
    canonical: cfg.siteUrl + o.path,
    scripts: ['/js/reading.js'],
    body,
  });
}

/* ---------- Halaman artikel ---------- */
// Tombol bagikan (semua artikel)
// Chip kategori buku (bisa diklik). Maksimal 8 terlihat; sisanya disembunyikan di balik tombol "+N lagi".
const MAX_CHIPS = 8;
function tagChips(tags, S) {
  if (!tags || !tags.length) return '';
  const chip = (t, i) => `<a class="tag-chip${i >= MAX_CHIPS ? ' is-extra' : ''}" href="${esc(t.href)}">${esc(t.label)}</a>`;
  const more = tags.length > MAX_CHIPS ? `<button type="button" class="tag-more" data-more>${S.moreTags(tags.length - MAX_CHIPS)}</button>` : '';
  return `        <div class="article-tags" aria-label="${esc(S.tagsAria)}">${tags.map(chip).join('')}${more}</div>`;
}

function shareBar(cfg, p, lang = 'id') {
  const S = STR[lang];
  const url = cfg.siteUrl + p.url;
  const wa = 'https://wa.me/?text=' + encodeURIComponent(`${p.title}\n${url}`);
  return `        <div class="share-bar" id="shareBar" data-title="${esc(p.title)}" data-url="${esc(url)}">
          <span class="share-label">${S.share}</span>
          <button type="button" class="share-btn" data-share="native" hidden>${S.shareBtn}</button>
          <a class="share-btn" href="${esc(wa)}" target="_blank" rel="noopener">💬 WhatsApp</a>
          <button type="button" class="share-btn" data-share="copy">${S.copyLink}</button>
        </div>`;
}

// Panel wallpaper (doa / quote pendek): gambar dibuat di browser pembaca oleh js/wallpaper.js
function wallpaperPanel(cfg, p, lang = 'id') {
  const S = STR[lang];
  const w = p.wallpaper;
  if (!w) return '';
  const url = cfg.siteUrl + p.url;
  const data = JSON.stringify({ ...w, title: p.title, slug: p.slug, url, site: cfg.siteUrl.replace(/^https?:\/\//, '') }).replace(/</g, '\\u003c');
  return `        <section class="wp-panel" id="wpPanel" aria-labelledby="wpHeading">
          <div class="wp-preview"><canvas id="wpCanvas" width="1080" height="1920" role="img" aria-label="${S.wpPreview} ${esc(p.title)}"></canvas></div>
          <div class="wp-side">
            <h2 id="wpHeading">🖼️ Wallpaper</h2>
            <p class="wp-hint">${S.wpHint}</p>
            <div class="wp-themes" id="wpThemes" role="group" aria-label="${S.wpColors}"></div>
            <div class="wp-actions">
              <button type="button" class="share-btn primary" id="wpShare" hidden>${S.wpShare}</button>
              <button type="button" class="share-btn" id="wpDownload">${S.wpDownload}</button>
              <button type="button" class="share-btn" id="wpCaption">${S.wpCopy}</button>
            </div>
            <p class="wp-note" id="wpNote" hidden></p>
          </div>
          <script type="application/json" id="wpData">${data}</script>
        </section>`;
}

function articlePage(cfg, o) {
  const p = o.post;
  const lang = o.lang || 'id';
  const S = STR[lang];
  const bd = p.bookData || {};
  const coverSrc = p.cover ? encodeURI('/' + p.cover) : placeholderUri(p.type);
  const author = bd.bookAuthor
    ? `<p class="article-author">✍️ ${S.author} ${esc(bd.bookAuthor)}${bd.bookYear ? ` (${esc(bd.bookYear)})` : ''}</p>`
    : '';
  const toc = o.toc.length
    ? `      <div class="sidebar-right-sticky">
        <aside id="tocSidebarCard" class="toc-card-container">
          <h3 class="sidebar-title">${S.tocTitle}</h3>
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
          <h2>${S.related}</h2>
          <ul>
${o.related.map((r) => `            <li><a href="${esc(r.url)}">${esc(r.title)}</a> <span class="related-type">${esc(typeLabel(r.type, lang))}</span></li>`).join('\n')}
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

  const body = `${progressUi}${header(cfg, 'article', { lang, alt: o.alt })}

    <main class="container article-layout">
      <div class="sidebar-left-sticky">
        <aside class="category-card-container">
          <h3 class="sidebar-title">${S.catTitle}</h3>
          <div class="category-scroll-area" id="accordionContainer" data-slug="${esc(p.slug)}" data-tags="${esc(JSON.stringify(p.categories))}" data-index="/data/index.json?v=${cfg.assetVersion}">
            <p style="color: #777; font-size: 12px;">${S.loading}</p>
          </div>
        </aside>
      </div>

      <section class="main-article-card">
        <div id="articleHeroBox" class="article-hero-box">
          <img id="articleCover" class="article-hero-cover" src="${esc(coverSrc)}" alt="${S.cover} ${esc(p.title)}" data-t="${esc(p.type)}" decoding="async" onerror="coverFallback(this)" />
          <div class="article-hero-info">
            <a class="article-badge-tag" href="${esc(p.typeUrl)}">${esc(typeLabel(p.type, lang))}</a>
            <h1 class="article-title-sub">${esc(p.title)}</h1>
            ${author}
            <p class="article-core-desc">${esc(p.core)}</p>
            <div class="article-date-row">📅 ${S.date} <strong>${esc(p.date)}</strong>${p.readMin ? ` · ⏱ <strong>${S.minRead(p.readMin)}</strong>` : ''}</div>
          </div>
        </div>
${tagChips(o.tags, S)}
${shareBar(cfg, p, lang)}
${wallpaperPanel(cfg, p, lang)}

        <article id="articleContent" class="article-content"${trackAttrs}>
${o.bodyHtml}
        </article>
${related}
      </section>

${toc}
    </main>

${footer(cfg, lang)}`;

  const url = cfg.siteUrl + p.url;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: o.description,
    image: [o.ogImage],
    datePublished: p.dateISO,
    dateModified: p.dateISO,
    inLanguage: lang,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: cfg.author },
    articleSection: typeLabel(p.type, lang),
  };
  if (bd.bookAuthor && /book/i.test(p.type)) {
    ld.about = { '@type': 'Book', name: (lang === 'en' ? p.title : bd.bookTitle) || p.title, author: { '@type': 'Person', name: bd.bookAuthor } };
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: S.home, item: cfg.siteUrl + (lang === 'en' ? '/en/' : '/') },
      { '@type': 'ListItem', position: 2, name: typeLabel(p.type, lang), item: cfg.siteUrl + p.typeUrl },
      { '@type': 'ListItem', position: 3, name: p.title, item: url },
    ],
  };

  return layout({
    cfg,
    lang,
    alt: o.alt,
    title: `${p.title} — ${cfg.siteName}`,
    ogTitle: p.title,
    description: o.description,
    canonical: url,
    ogType: 'article',
    ogImage: o.ogImage,
    twitterCard: p.cover && !o.ogIsCard ? 'summary' : 'summary_large_image',
    published: p.dateISO,
    css: ['/css/article.css'],
    scripts: [
      ...(tracked ? ['/js/reading.js'] : []),
      '/js/article.js',
      '/js/share.js',
      ...(p.wallpaper ? ['/js/wallpaper.js'] : []),
    ],
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

module.exports = { esc, emojiFor, typeLabel, layout, homePage, listPage, articlePage, notFoundPage, legacyRedirectPage, pager, card };

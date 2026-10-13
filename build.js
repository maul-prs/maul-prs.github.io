#!/usr/bin/env node
'use strict';
/*
  Generator website statis — tanpa dependency.
  Jalankan:  node build.js        (hasil di folder dist/)
  Di GitHub, ini dijalankan otomatis oleh .github/workflows/pages.yml
  setiap ada perubahan di repo.

  Sumber konten:
    content/posts/<slug>.json   metadata artikel
    content/posts/<slug>.html   isi artikel
    posts.json                  (format lama, tetap dibaca jika masih ada)
*/
const fs = require('fs');
const path = require('path');
const T = require('./templates.js');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
cfg.assetVersion = Date.now().toString(36);

/* ---------------- Util ---------------- */
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function slugify(s) {
  return (
    String(s || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['’`]/g, '')
      .replace(/&/g, ' dan ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '') || 'post'
  );
}

function parseIndoDate(s) {
  const m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(s || '');
  if (!m) return '';
  const idx = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
  if (idx < 0) return '';
  return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
}

function formatIndo(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function plainText(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

function write(rel, content) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------- Baca konten ---------------- */
// File artikel utuh (<!doctype><html><head>…) dirapikan: ambil <style>/<link stylesheet> dan isi <body>.
function normalizeBody(raw) {
  const html = String(raw || '');
  if (!/<(html|head|body)[\s>]/i.test(html)) return html.trim();
  const head = (/<head[^>]*>([\s\S]*?)<\/head>/i.exec(html) || [])[1] || '';
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const body = bodyMatch
    ? bodyMatch[1]
    : html.replace(/<!doctype[^>]*>/gi, '').replace(/<head[\s\S]*?<\/head>/gi, '').replace(/<\/?(html|body)[^>]*>/gi, '');
  const keep = [];
  (head.match(/<style[\s\S]*?<\/style>/gi) || []).forEach((m) => keep.push(m));
  (head.match(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi) || []).forEach((m) => keep.push(m));
  return (keep.join('\n') + '\n' + body).trim();
}

function loadRawPosts() {
  const posts = [];
  const dir = path.join(ROOT, 'content', 'posts');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      try {
        const base = f.slice(0, -5);
        const meta = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        const htmlPath = path.join(dir, base + '.html');
        meta.slug = base; // nama file = slug (alamat URL)
        meta._body = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : meta.fullContent || '';
        posts.push(meta);
      } catch (e) {
        console.warn(`! Lewati ${f}: ${e.message}`);
      }
    }
  }
  // Format lama (posts.json) — tetap dibaca supaya situs tidak kosong sebelum migrasi
  const legacy = path.join(ROOT, 'posts.json');
  if (fs.existsSync(legacy)) {
    try {
      const data = JSON.parse(fs.readFileSync(legacy, 'utf8'));
      const arr = Array.isArray(data) ? data : data.posts || [];
      const ids = new Set(posts.map((p) => String(p.id)));
      let n = 0;
      arr.forEach((p) => {
        if (ids.has(String(p.id))) return;
        posts.push({ ...p, slug: '', _body: p.fullContent || '', _legacy: true });
        n++;
      });
      console.log(`  posts.json lama dibaca: ${n} postingan (jalankan Migrasi di admin untuk memindahkannya)`);
    } catch (e) {
      console.warn(`! posts.json lama bukan JSON valid, dilewati (${e.message})`);
    }
  }
  return posts;
}

function normalizePosts(raw) {
  const taken = new Set(raw.filter((p) => p.slug).map((p) => p.slug));
  const today = new Date().toISOString().slice(0, 10);
  const posts = raw.map((p) => {
    const bd = p.bookData || {};
    const type = p.type || p.category || bd.bookMainCategory || 'Catatan';
    const cats = (Array.isArray(p.categories) && p.categories.length ? p.categories : [type]).map((c) => String(c).trim()).filter(Boolean);
    const dateISO = /^\d{4}-\d{2}-\d{2}$/.test(p.dateISO || '') ? p.dateISO : parseIndoDate(p.date) || today;
    return {
      id: String(p.id ?? ''),
      slug: p.slug,
      title: String(p.title || 'Tanpa judul'),
      type,
      categories: cats,
      dateISO,
      date: p.date || formatIndo(dateISO),
      cover: String(p.cover || '').trim().replace(/^\.?\/+/, ''),
      core: String(p.coreMessage || bd.bookCore || p.summary || '').trim(),
      author: bd.bookAuthor || '',
      bookData: bd,
      status: p.status === 'archived' ? 'archived' : 'active',
      _body: p._body || '',
      legacy: !!p._legacy,
    };
  });
  // slug untuk postingan format lama / tanpa slug
  for (const p of posts) {
    if (p.slug) continue;
    let s = slugify(p.title);
    if (taken.has(s)) s = `${s}-${slugify(p.id)}`;
    let n = 2;
    const base = s;
    while (taken.has(s)) s = `${base}-${n++}`;
    taken.add(s);
    p.slug = s;
  }
  posts.sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : String(b.id).localeCompare(String(a.id), undefined, { numeric: true })));
  return posts;
}

/* ---------------- Cover ---------------- */
function resolveCover(p) {
  if (!p.cover) return '';
  if (/^https?:/i.test(p.cover)) return p.cover;
  // Cover lama tersimpan sebagai data URI (base64) di dalam JSON. Ubah jadi file gambar di dist/images/
  // supaya index.json tetap kecil dan gambar benar-benar tampil.
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/i.exec(p.cover);
  if (m) {
    const ext = m[1].toLowerCase().replace('jpeg', 'jpg');
    const rel = `images/cover-${p.slug}.${ext}`;
    fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
    fs.writeFileSync(path.join(OUT, rel), Buffer.from(m[2].replace(/\s+/g, ''), 'base64'));
    return rel;
  }
  if (/^data:/i.test(p.cover)) return '';
  return fs.existsSync(path.join(ROOT, p.cover)) ? p.cover : '';
}

/* ---------------- Isi artikel: id heading & daftar bab ---------------- */
function processBody(html) {
  const used = new Set();
  const toc = [];
  const out = html.replace(/<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi, (m, lvl, attrs, inner) => {
    attrs = attrs || '';
    const found = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    let id = found ? found[1] || found[2] || '' : '';
    const text = plainText(inner);
    if (!id) {
      const base = slugify(text) === 'post' ? 'bagian' : slugify(text);
      id = base;
      let n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
      attrs += ` id="${id}"`;
    }
    used.add(id);
    if (text) toc.push({ id, text, level: Number(lvl) });
    return `<h${lvl}${attrs}>${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

/* ---------------- Build ---------------- */
function main() {
  const t0 = Date.now();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const all = normalizePosts(loadRawPosts());
  const active = all.filter((p) => p.status === 'active');
  console.log(`Postingan: ${all.length} (aktif ${active.length}, arsip ${all.length - active.length})`);

  // entri publik
  const typeSlugs = new Map();
  const typeCount = new Map();
  active.forEach((p) => typeCount.set(p.type, (typeCount.get(p.type) || 0) + 1));
  for (const t of typeCount.keys()) {
    let s = slugify(t);
    while ([...typeSlugs.values()].includes(s)) s += '-2';
    typeSlugs.set(t, s);
  }
  const pub = active.map((p) => ({
    id: p.id,
    slug: p.slug,
    url: `/artikel/${p.slug}/`,
    title: p.title,
    type: p.type,
    typeUrl: `/kategori/${typeSlugs.get(p.type)}/`,
    categories: p.categories,
    date: p.date,
    dateISO: p.dateISO,
    cover: resolveCover(p),
    core: truncate(p.core || plainText(p._body).slice(0, 400), 170),
    author: p.author,
    ...(p.legacy ? { legacy: true } : {}),
  }));
  const bySlug = new Map(pub.map((p) => [p.slug, p]));

  // peta tag -> postingan (untuk "Baca juga")
  const tagMap = new Map();
  pub.forEach((p) => [...p.categories, p.type].forEach((t) => {
    if (!tagMap.has(t)) tagMap.set(t, []);
    tagMap.get(t).push(p);
  }));

  /* 1. Halaman artikel */
  for (const src of active) {
    const p = bySlug.get(src.slug);
    const norm = normalizeBody(src._body) || `<p>${T.esc(p.core || p.title)}</p>`;
    const { html, toc } = processBody(norm);

    const scores = new Map();
    new Set([...p.categories, p.type]).forEach((t) => (tagMap.get(t) || []).forEach((r) => {
      if (r.slug !== p.slug) scores.set(r, (scores.get(r) || 0) + (p.categories.includes(t) ? 2 : 1));
    }));
    const related = [...scores.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0].dateISO < b[0].dateISO ? 1 : -1))
      .slice(0, 6)
      .map((e) => e[0]);

    const description = truncate(p.core || plainText(html), 160) || cfg.description;
    const ogImage = p.cover ? (/^https?:/i.test(p.cover) ? p.cover : `${cfg.siteUrl}${encodeURI('/' + p.cover)}`) : `${cfg.siteUrl}/${cfg.ogDefaultImage}`;

    write(`artikel/${p.slug}/index.html`, T.articlePage(cfg, { post: { ...p, bookData: src.bookData }, bodyHtml: html, toc, related, description, ogImage }));
  }

  /* 2. Data ringan untuk beranda, pencarian, sidebar & admin */
  const publicList = pub.map(({ typeUrl, ...rest }) => rest);
  const archivedStubs = all
    .filter((p) => p.status === 'archived')
    .map((p) => ({ id: p.id, slug: p.slug, title: p.title, type: p.type, date: p.date, dateISO: p.dateISO, status: 'archived', ...(p.legacy ? { legacy: true } : {}) }));
  write('data/index.json', JSON.stringify([...publicList, ...archivedStubs]));

  /* 3. Beranda */
  const extraTypes = [...typeCount.keys()].filter((t) => !['Book Summary', 'Quote & Nasehat', "Dzikir & Do'a", 'Cerita Inspirasi'].includes(t));
  write('index.html', T.homePage(cfg, { posts: pub.slice(0, cfg.homePerPage), extraTypes }));

  /* 4. Arsip semua tulisan + halaman kategori (dengan paginasi) */
  const per = cfg.archivePerPage;
  const sitemapExtra = [];
  function paginate(list, basePath, heading, intro, crumb) {
    const total = Math.max(1, Math.ceil(list.length / per));
    const hrefFor = (n) => (n === 1 ? basePath : `${basePath}halaman/${n}/`);
    for (let n = 1; n <= total; n++) {
      const rel = (n === 1 ? basePath : `${basePath}halaman/${n}/`).replace(/^\//, '') + 'index.html';
      write(
        rel,
        T.listPage(cfg, {
          title: `${heading}${n > 1 ? ` — Halaman ${n}` : ''} — ${cfg.siteName}`,
          heading: n > 1 ? `${heading} (halaman ${n})` : heading,
          intro,
          crumb,
          path: hrefFor(n),
          posts: list.slice((n - 1) * per, n * per),
          pagerHtml: T.pager(n, total, hrefFor),
        })
      );
      sitemapExtra.push(hrefFor(n));
    }
  }
  paginate(pub, '/arsip/', 'Semua Tulisan', `Seluruh ${pub.length} tulisan di ${cfg.siteName}, dari yang terbaru.`, 'Semua Tulisan');
  for (const [type, slug] of typeSlugs) {
    const list = pub.filter((p) => p.type === type);
    paginate(list, `/kategori/${slug}/`, type, `${list.length} tulisan dalam kategori ${type}.`, T.esc(type));
  }

  /* 5. Sitemap, RSS, robots, 404, redirect link lama */
  const urls = [{ loc: '/', lastmod: pub[0] ? pub[0].dateISO : '' }, ...sitemapExtra.map((u) => ({ loc: u, lastmod: '' })), ...pub.map((p) => ({ loc: p.url, lastmod: p.dateISO }))];
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${xmlEsc(cfg.siteUrl + encodeURI(u.loc))}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
      `\n</urlset>\n`
  );
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
  write(
    'feed.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${xmlEsc(cfg.siteName)}</title>\n<link>${cfg.siteUrl}/</link>\n<description>${xmlEsc(cfg.description)}</description>\n<language>id</language>\n` +
      pub
        .slice(0, 30)
        .map((p) => `<item><title>${xmlEsc(p.title)}</title><link>${xmlEsc(cfg.siteUrl + p.url)}</link><guid>${xmlEsc(cfg.siteUrl + p.url)}</guid><pubDate>${new Date(p.dateISO + 'T00:00:00Z').toUTCString()}</pubDate><description>${xmlEsc(p.core)}</description></item>`)
        .join('\n') +
      `\n</channel></rss>\n`
  );
  write('404.html', T.notFoundPage(cfg));
  write('article.html', T.legacyRedirectPage(cfg));

  /* 6. File statis */
  for (const d of ['css', 'js', 'assets', 'images']) {
    const src = path.join(ROOT, d);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(OUT, d), { recursive: true });
  }
  const staticDir = path.join(ROOT, 'static'); // file tambahan yang harus ada di root (mis. verifikasi Google)
  if (fs.existsSync(staticDir)) fs.cpSync(staticDir, OUT, { recursive: true });
  for (const f of fs.readdirSync(ROOT)) {
    if (/^(admin\.html|CNAME|favicon\.ico|google[\w-]*\.html|BingSiteAuth\.xml|ads\.txt)$/.test(f)) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
  }
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

  console.log(`Selesai dalam ${Date.now() - t0} ms → ${urls.length} URL di sitemap.`);
}

main();

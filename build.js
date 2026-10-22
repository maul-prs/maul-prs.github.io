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
const crypto = require('crypto');
const path = require('path');
const T = require('./templates.js');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
cfg.assetVersion = Date.now().toString(36);

/* ---------------- Util ---------------- */
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

function formatEn(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS_EN[m - 1]} ${d}, ${y}`;
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
        const enPath = path.join(dir, base + '.en.html');
        meta._bodyEn = fs.existsSync(enPath) ? fs.readFileSync(enPath, 'utf8') : '';
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

// Data wallpaper (doa / quote pendek): hanya empat teks sederhana
function cleanWallpaper(w) {
  if (!w || typeof w !== 'object') return null;
  const f = (k) => String(w[k] || '').trim().slice(0, 1500);
  const out = { arabic: f('arabic'), latin: f('latin'), translation: f('translation'), source: f('source') };
  return out.arabic || out.latin || out.translation ? out : null;
}

// Versi Inggris (opsional): judul, inti, terjemahan wallpaper. Tanpa judul Inggris = artikel hanya berbahasa Indonesia.
function cleanEn(e) {
  if (!e || typeof e !== 'object') return null;
  const f = (k, n) => String(e[k] || '').trim().slice(0, n);
  const out = {
    title: f('title', 200),
    core: f('coreMessage', 1500),
    wallpaperTranslation: f('wallpaperTranslation', 1500),
    ogImage: f('ogImage', 300).replace(/^\.?\/+/, ''),
  };
  return out.title ? out : null;
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
      readMin: (() => {
        const m = String(bd.bookReadTime || '').match(/\d+/); // angka menit; teks lama seperti "15-20 menit" diambil angka pertamanya
        const n = m ? parseInt(m[0], 10) : 0;
        return n >= 1 && n <= 600 ? n : 0;
      })(),
      bookData: bd,
      wallpaper: cleanWallpaper(p.wallpaper),
      en: cleanEn(p.en),
      _bodyEn: p._bodyEn || '',
      ogImage: String(p.ogImage || '').trim().replace(/^\.?\/+/, ''),
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
// Cover yang tersimpan sebagai data URI (base64) di JSON diubah menjadi file di dist/images/covers/,
// supaya tidak hilang diam-diam dan tidak membengkakkan HTML.
const EXT = { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', avif: 'avif' };
function resolveCover(p) {
  if (!p.cover) return '';
  if (/^https?:/i.test(p.cover)) return p.cover;
  const m = /^data:image\/([a-z0-9+.-]+);base64,([\s\S]+)$/i.exec(p.cover);
  if (m) {
    const ext = EXT[m[1].toLowerCase()];
    if (!ext) {
      console.warn(`! Cover "${p.slug}": format ${m[1]} tidak didukung, pakai placeholder`);
      return '';
    }
    const buf = Buffer.from(m[2], 'base64');
    const rel = `images/covers/${p.slug}-${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8)}.${ext}`;
    write(rel, buf);
    console.log(`  cover base64 "${p.slug}" -> ${rel} (${Math.round(buf.length / 1024)} KB) — sebaiknya simpan ulang lewat admin`);
    return rel;
  }
  if (fs.existsSync(path.join(ROOT, p.cover))) return p.cover;
  console.warn(`! Cover "${p.slug}": file tidak ditemukan (${p.cover}), pakai placeholder`);
  return '';
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
  // Tayang terjadwal: artikel baru tayang saat tanggalnya tiba (zona WIB). Build harian di pages.yml yang memunculkannya.
  const todayWib = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const scheduled = all.filter((p) => p.status === 'active' && p.dateISO > todayWib);
  const active = all.filter((p) => p.status === 'active' && p.dateISO <= todayWib);
  console.log(`Postingan: ${all.length} (aktif ${active.length}, terjadwal ${scheduled.length}, arsip ${all.filter((p) => p.status === 'archived').length}) — hari ini ${todayWib} WIB`);

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
    dateEn: formatEn(p.dateISO),
    ...(p.readMin ? { readMin: p.readMin } : {}),
    ...(p.en
      ? { en: { title: p.en.title, core: truncate(p.en.core || plainText(p._bodyEn).slice(0, 400), 170), url: `/en/artikel/${p.slug}/` } }
      : {}),
    ...(p.legacy ? { legacy: true } : {}),
  }));
  const enOn = active.some((p) => p.en); // halaman /en/ hanya dibuat kalau sudah ada artikel yang diterjemahkan
  const enView = (p) =>
    p.en
      ? { ...p, title: p.en.title, core: p.en.core, url: p.en.url, date: p.dateEn, typeUrl: '/en' + p.typeUrl }
      : { ...p, date: p.dateEn, typeUrl: '/en' + p.typeUrl, untranslated: true };
  const bySlug = new Map(pub.map((p) => [p.slug, p]));

  // peta tag -> postingan (untuk "Baca juga")
  const tagMap = new Map();
  pub.forEach((p) => [...p.categories, p.type].forEach((t) => {
    if (!tagMap.has(t)) tagMap.set(t, []);
    tagMap.get(t).push(p);
  }));

  // Kategori buku (tag) -> halaman /tag/<slug>/. Nama jenis (Book Summary, dll.) sudah punya halaman /kategori/, jadi dilewati.
  const typeNames = new Set(pub.map((p) => p.type));
  const tagIndex = new Map(); // slug -> { label, list }
  pub.forEach((p) =>
    p.categories.forEach((c) => {
      const sl = slugify(c);
      if (typeNames.has(c) || !sl) return;
      if (!tagIndex.has(sl)) tagIndex.set(sl, { label: c, list: [] });
      const e = tagIndex.get(sl);
      if (!e.list.includes(p)) e.list.push(p);
    })
  );
  const tagsFor = (p, lang) => {
    const seen = new Set();
    return p.categories
      .map((c) => ({ label: c, sl: slugify(c) }))
      .filter((t) => !typeNames.has(t.label) && t.sl && !seen.has(t.sl) && seen.add(t.sl))
      .map((t) => ({ label: t.label, href: `${lang === 'en' ? '/en' : ''}/tag/${t.sl}/` }));
  };

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
    // Gambar share 1200x630 (dibuat admin saat menyimpan); kalau belum ada, pakai cover, lalu gambar default
    let ogIsCard = false;
    let ogImage = p.cover ? (/^https?:/i.test(p.cover) ? p.cover : `${cfg.siteUrl}${encodeURI('/' + p.cover)}`) : `${cfg.siteUrl}/${cfg.ogDefaultImage}`;
    if (src.ogImage) {
      if (fs.existsSync(path.join(ROOT, src.ogImage))) {
        ogImage = `${cfg.siteUrl}${encodeURI('/' + src.ogImage)}`;
        ogIsCard = true;
      } else {
        console.warn(`! Gambar share "${p.slug}" tidak ditemukan (${src.ogImage}), pakai cover`);
      }
    }

    write(
      `artikel/${p.slug}/index.html`,
      T.articlePage(cfg, {
        post: { ...p, bookData: src.bookData, wallpaper: src.wallpaper },
        bodyHtml: html,
        toc,
        related,
        description,
        ogImage,
        ogIsCard,
        tags: tagsFor(p, 'id'),
        alt: { id: p.url, en: p.en ? p.en.url : null },
      })
    );

    // Versi Inggris: /en/artikel/<slug>/
    if (p.en) {
      const view = enView(p);
      const rawEn = normalizeBody(src._bodyEn) || `<p>${T.esc(src.en.core || src.en.title)}</p>`;
      const en = processBody(rawEn);
      let ogEn = ogImage;
      let ogEnIsCard = ogIsCard;
      if (src.en.ogImage) {
        if (fs.existsSync(path.join(ROOT, src.en.ogImage))) {
          ogEn = `${cfg.siteUrl}${encodeURI('/' + src.en.ogImage)}`;
          ogEnIsCard = true;
        } else {
          console.warn(`! Gambar share Inggris \"${p.slug}\" tidak ditemukan (${src.en.ogImage}), pakai gambar versi Indonesia`);
        }
      }
      // Wallpaper Inggris butuh terjemahan Inggris; tanpa itu panel disembunyikan supaya bahasa tidak tercampur
      let wpEn = null;
      if (src.wallpaper) {
        const tr = src.en.wallpaperTranslation;
        if (tr || !src.wallpaper.translation) wpEn = { ...src.wallpaper, translation: tr };
      }
      write(
        `en/artikel/${p.slug}/index.html`,
        T.articlePage(cfg, {
          post: { ...view, bookData: src.bookData, wallpaper: wpEn },
          bodyHtml: en.html,
          toc: en.toc,
          related: related.map(enView),
          description: truncate(view.core || plainText(en.html), 160) || cfg.descriptionEn || cfg.description,
          ogImage: ogEn,
          ogIsCard: ogEnIsCard,
          tags: tagsFor(p, 'en'),
          lang: 'en',
          alt: { id: p.url, en: p.en.url },
        })
      );
    }
  }

  /* 2. Data ringan untuk beranda, pencarian, sidebar & admin */
  const publicList = pub.map(({ typeUrl, ...rest }) => rest);
  // Yang belum tayang ikut dicatat sebagai stub (status 'archived' + scheduled) supaya tidak tampil di publik tapi tetap muncul di admin
  const archivedStubs = all
    .filter((p) => p.status === 'archived' || scheduled.includes(p))
    .map((p) => ({ id: p.id, slug: p.slug, title: p.title, type: p.type, date: p.date, dateISO: p.dateISO, status: 'archived', ...(scheduled.includes(p) ? { scheduled: true } : {}), ...(p.en ? { hasEn: true } : {}), ...(p.legacy ? { legacy: true } : {}) }));
  write('data/index.json', JSON.stringify([...publicList, ...archivedStubs]));

  /* 3. Beranda */
  const extraTypes = [...typeCount.keys()].filter((t) => !['Book Summary', 'Quote & Nasehat', "Dzikir & Do'a", 'Cerita Inspirasi'].includes(t));
  const homeAlt = { id: '/', en: enOn ? '/en/' : null };
  write('index.html', T.homePage(cfg, { posts: pub.slice(0, cfg.homePerPage), extraTypes, alt: homeAlt }));
  if (enOn) write('en/index.html', T.homePage(cfg, { posts: pub.slice(0, cfg.homePerPage).map(enView), extraTypes, alt: homeAlt }, 'en'));

  /* 4. Arsip semua tulisan + halaman kategori (dengan paginasi) */
  const per = cfg.archivePerPage;
  const sitemapExtra = [];
  // t = { id: {heading, intro, crumb}, en: {...} }; halaman Inggris dibuat hanya kalau enOn
  function paginate(list, basePath, t) {
    const total = Math.max(1, Math.ceil(list.length / per));
    const pathFor = (base, n) => (n === 1 ? base : `${base}halaman/${n}/`);
    for (let n = 1; n <= total; n++) {
      const alt = { id: pathFor(basePath, n), en: enOn ? pathFor('/en' + basePath, n) : null };
      for (const lang of enOn ? ['id', 'en'] : ['id']) {
        const base = lang === 'en' ? '/en' + basePath : basePath;
        const hrefFor = (k) => pathFor(base, k);
        const x = t[lang];
        const pageWord = lang === 'en' ? ['Page', 'page'] : ['Halaman', 'halaman'];
        write(
          hrefFor(n).replace(/^\//, '') + 'index.html',
          T.listPage(cfg, {
            lang,
            alt,
            title: `${x.heading}${n > 1 ? ` — ${pageWord[0]} ${n}` : ''} — ${cfg.siteName}`,
            heading: n > 1 ? `${x.heading} (${pageWord[1]} ${n})` : x.heading,
            intro: x.intro,
            crumb: x.crumb,
            path: hrefFor(n),
            posts: (lang === 'en' ? list.map(enView) : list).slice((n - 1) * per, n * per),
            pagerHtml: T.pager(n, total, hrefFor),
          })
        );
        sitemapExtra.push({ loc: hrefFor(n), alt: enOn ? alt : null });
      }
    }
  }
  paginate(pub, '/arsip/', {
    id: { heading: 'Semua Tulisan', intro: `Seluruh ${pub.length} tulisan di ${cfg.siteName}, dari yang terbaru.`, crumb: 'Semua Tulisan' },
    en: { heading: 'All Posts', intro: `All ${pub.length} posts on ${cfg.siteName}, newest first.`, crumb: 'All Posts' },
  });
  for (const [sl, { label, list }] of tagIndex) {
    paginate(list, `/tag/${sl}/`, {
      id: { heading: label, intro: `${list.length} tulisan dengan kategori "${label}".`, crumb: T.esc(label) },
      en: { heading: label, intro: `${list.length} ${list.length > 1 ? 'posts' : 'post'} in the "${label}" category.`, crumb: T.esc(label) },
    });
  }
  for (const [type, slug] of typeSlugs) {
    const list = pub.filter((p) => p.type === type);
    const typeEn = T.typeLabel(type, 'en');
    paginate(list, `/kategori/${slug}/`, {
      id: { heading: type, intro: `${list.length} tulisan dalam kategori ${type}.`, crumb: T.esc(type) },
      en: { heading: typeEn, intro: `${list.length} posts in the ${typeEn} category.`, crumb: T.esc(typeEn) },
    });
  }

  /* 5. Sitemap, RSS, robots, 404, redirect link lama */
  const pair = (a, b) => (b ? { id: a, en: b } : null);
  const urls = [
    { loc: '/', lastmod: pub[0] ? pub[0].dateISO : '', alt: enOn ? homeAlt : null },
    ...(enOn ? [{ loc: '/en/', lastmod: pub[0] ? pub[0].dateISO : '', alt: homeAlt }] : []),
    ...sitemapExtra.map((u) => ({ loc: u.loc, lastmod: '', alt: u.alt })),
    ...pub.flatMap((p) => {
      const a = pair(p.url, p.en && p.en.url);
      return [{ loc: p.url, lastmod: p.dateISO, alt: a }, ...(p.en ? [{ loc: p.en.url, lastmod: p.dateISO, alt: a }] : [])];
    }),
  ];
  const altLinks = (a) =>
    a
      ? `<xhtml:link rel="alternate" hreflang="id" href="${xmlEsc(cfg.siteUrl + encodeURI(a.id))}"/><xhtml:link rel="alternate" hreflang="en" href="${xmlEsc(cfg.siteUrl + encodeURI(a.en))}"/><xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(cfg.siteUrl + encodeURI(a.id))}"/>`
      : '';
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
      urls.map((u) => `  <url><loc>${xmlEsc(cfg.siteUrl + encodeURI(u.loc))}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}${altLinks(u.alt)}</url>`).join('\n') +
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

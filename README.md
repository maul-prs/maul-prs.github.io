# Maul Prs

Situs statis. Isi ada di `content/posts/` (satu `.json` + satu `.html` per artikel), lalu `build.js`
membuat folder `dist/` yang di-deploy GitHub Pages lewat `.github/workflows/pages.yml`.

## Pengaturan wajib (sekali saja)
Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Kalau Source masih "Deploy from a branch", GitHub menyajikan file mentah di root repo, bukan hasil build,
sehingga beranda lama tampil dan artikel (`/artikel/...`) memberi 404.

## Struktur
- `content/posts/<slug>.json|.html` — metadata dan isi artikel
- `css/`, `js/`, `assets/`, `images/` — file statis (disalin apa adanya ke `dist/`)
- `build.js`, `templates.js`, `site.config.json` — generator
- `admin.html` — panel admin (commit langsung ke GitHub)

Jangan taruh `index.html`, `article.html`, `posts.json`, `style.css`, dll. di root: beranda dan artikel dibuat oleh `build.js`.

## Menambah / mengedit artikel
Lewat `/admin.html`. Setiap simpan membuat commit, lalu Actions membangun ulang situs (±1 menit).

## Jalankan lokal
    node build.js
    python3 -m http.server 8000 --directory dist

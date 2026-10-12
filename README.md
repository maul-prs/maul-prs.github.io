# Maul Prs — Master V2

V2 sudah memperbaiki alur data: `data/posts.json` dibaca oleh `js/app.js`, lalu dirender ke homepage dan halaman artikel dinamis.

## Jalankan lokal
Di PowerShell/Terminal, masuk ke folder ini lalu:
`python -m http.server 8000`
Buka `http://localhost:8000`

Jangan hanya double-click `index.html`, karena browser dapat memblokir pembacaan JSON lewat `fetch()`.

## Menambah post
Tambahkan object baru ke array `data/posts.json`. Foto diletakkan di `assets/` lalu isi field `image`, misalnya `assets/nasehat-001.jpg`.

V2 belum memakai database atau admin dashboard. Itu bisa menjadi tahap berikutnya.


### Master V3 changes
- Softer warm-neutral background for longer reading comfort.
- Article body typography reduced slightly for a calmer editorial reading experience.
- Search and category filters are now independent. Choosing a category no longer fills the search box.
- Category selection is visually marked as active.

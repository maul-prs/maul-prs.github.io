/* Teks antarmuka untuk skrip di browser. Bahasa halaman = atribut lang di <html> (id / en).
   Pemakaian: MaulI18n.t('kunci', { n: 3 }). Bahasa Indonesia = teks asli situs. */
(function () {
  'use strict';
  var lang = document.documentElement.lang === 'en' ? 'en' : 'id';

  var D = {
    id: {
      readMore: 'Baca Selengkapnya →',
      noPosts: 'Tidak ada postingan yang ditemukan.',
      focusOn: 'Mode Fokus',
      focusOff: 'Keluar Fokus',
      showMore: 'Tampilkan lebih banyak ({n})',
      showAllTags: 'Tampilkan semua kategori ({n} lagi)',
      menuFail: 'Menu tidak dapat dimuat.',
      copied: '✓ Tersalin',
      copyFail: 'Gagal menyalin',
      wpNight: 'Hijau malam',
      wpGold: 'Hitam emas',
      wpCream: 'Krem',
      wpOverflow: 'Teks terlalu panjang untuk satu wallpaper. Perpendek bagian Arab, Latin, atau terjemahan di admin.',
      wpTiny: 'Teks sangat panjang, jadi huruf di gambar dikecilkan{latin}. Sebaiknya perpendek teksnya di admin.',
      wpTinyLatin: ' dan bagian Latin tidak dicetak',
      wpDropped: 'Teks cukup panjang, jadi bagian Latin tidak dicetak di gambar supaya huruf tetap terbaca.',
      wpSmall: 'Teks cukup panjang, jadi ukuran hurufnya dikecilkan.',
      wpReadMore: 'Baca selengkapnya: ',
      today: 'hari ini',
      yesterday: 'kemarin',
      daysAgo: '{n} hari lalu',
      resumeHead: 'Lanjutkan Membaca',
      resumeMeta: '{pct}% · terakhir dibaca {ago}',
      go: 'Lanjutkan',
      hideAria: 'Sembunyikan {title}',
      doneAria: 'Sudah selesai dibaca',
      resumeAria: 'Lanjutkan membaca',
      continueFrom: 'Lanjut dari {pct}%?',
      lastAt: 'Terakhir di: ',
      restart: 'Dari awal',
      close: 'Tutup'
    },
    en: {
      readMore: 'Read more →',
      noPosts: 'No posts found.',
      focusOn: 'Focus Mode',
      focusOff: 'Exit Focus',
      showMore: 'Show more ({n})',
      showAllTags: 'Show all categories ({n} more)',
      menuFail: 'The menu could not be loaded.',
      copied: '✓ Copied',
      copyFail: 'Copy failed',
      wpNight: 'Night green',
      wpGold: 'Black & gold',
      wpCream: 'Cream',
      wpOverflow: 'The text is too long for a single wallpaper. Shorten the Arabic, Latin, or translation text in the admin.',
      wpTiny: 'The text is very long, so the letters on the image were made smaller{latin}. Consider shortening it in the admin.',
      wpTinyLatin: ' and the Latin part is left out',
      wpDropped: 'The text is fairly long, so the Latin part is left off the image to keep the letters readable.',
      wpSmall: 'The text is fairly long, so the letters were made smaller.',
      wpReadMore: 'Read more: ',
      today: 'today',
      yesterday: 'yesterday',
      daysAgo: '{n} days ago',
      resumeHead: 'Continue Reading',
      resumeMeta: '{pct}% · last read {ago}',
      go: 'Continue',
      hideAria: 'Hide {title}',
      doneAria: 'Finished reading',
      resumeAria: 'Continue reading',
      continueFrom: 'Continue from {pct}%?',
      lastAt: 'Last at: ',
      restart: 'Start over',
      close: 'Close'
    }
  };

  // Nama kategori utama (tag bebas seperti "Finance" tidak diterjemahkan)
  var TYPES = { 'Quote & Nasehat': 'Quotes & Advice', "Dzikir & Do'a": "Dhikr & Du'a", 'Cerita Inspirasi': 'Inspiring Stories' };

  window.MaulI18n = {
    lang: lang,
    t: function (key, vars) {
      var s = (D[lang] && D[lang][key]) || D.id[key] || key;
      if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
      return s;
    },
    type: function (name) { return lang === 'en' && TYPES[name] ? TYPES[name] : name; }
  };
})();

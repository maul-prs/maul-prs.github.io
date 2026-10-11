// posts.js - Basis data utama artikel untuk publik
const defaultPostsData = [
  {
    id: "1",
    title: "Dzikir & Do'a Pagi",
    type: "Dzikir & Do'a",
    category: "Dzikir & Do'a",
    categories: ["Dzikir & Do'a"],
    date: "10 Oktober 2026",
    cover: "assets/cover-dzikir.jpg",
    coreMessage: "Kumpulan bacaan dzikir dan doa penenang hati untuk mengawali pagi hari.",
    fullContent: "<h2 id='istiadzah'>Isti'adzah</h2><p>أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ...</p>",
    status: "active"
  },
  {
    id: "2",
    title: "The Lost Art of Listening",
    type: "Book Summary",
    category: "Book Summary",
    categories: ["Komunikasi", "Psychology"],
    date: "10 Oktober 2026",
    cover: "assets/cover-listening.jpg",
    coreMessage: "Mendengarkan sungguh-sungguh membuat orang merasa dimengerti dan itulah kunci hubungan yang sehat.",
    fullContent: "<h2>Pengantar: Tentang Buku Ini</h2><p>Pernahkah kamu bercerita panjang lebar...</p>",
    bookData: {
      bookAuthor: "Michael P. Nichols",
      bookYear: "1995"
    },
    status: "active"
  }
  // Anda bisa menambahkan artikel utama lainnya di sini
];
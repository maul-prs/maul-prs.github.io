document.addEventListener("DOMContentLoaded", function () {
  const postsContainer = document.getElementById("posts");
  const searchInput = document.getElementById("search");
  const emptyState = document.getElementById("empty");
  const filterButtons = document.querySelectorAll(".category-grid a");

  let allPosts = [];

  function createExcerpt(text, maxLength = 120) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  function loadPosts() {
    // Memuat langsung dari posts.json untuk menghindari data lama yang terjebak di localStorage
    fetch("data/posts.json")
      .then((response) => response.json())
      .then((data) => {
        allPosts = data;
        // Opsional: memperbarui localStorage dengan data terbaru
        localStorage.setItem("maul_posts", JSON.stringify(data));
        renderPosts(allPosts);
      })
      .catch((error) => {
        console.error("Gagal memuat data posts.json:", error);
        // Fallback jika fetch gagal, coba baca dari localStorage
        const localData = localStorage.getItem("maul_posts");
        if (localData) {
          allPosts = JSON.parse(localData);
          renderPosts(allPosts);
        } else {
          postsContainer.innerHTML =
            '<p class="empty">Belum ada postingan yang dimuat.</p>';
        }
      });
  }

  function renderPosts(postsToRender) {
    postsContainer.innerHTML = "";

    if (postsToRender.length === 0) {
      emptyState.hidden = false;
      return;
    } else {
      emptyState.hidden = true;
    }

    postsToRender.forEach((post) => {
      // Gunakan ID unik dari post atau index pencarian asli
      const originalIndex = allPosts.indexOf(post);
      const card = document.createElement("article");
      card.className = "card";

      let categoryLabel = "Artikel";
      if (post.category === "quote") categoryLabel = "Quotes / Nasehat";
      else if (post.category === "story") categoryLabel = "Cerita Inspirasi";
      else if (post.category === "book-summary") categoryLabel = "Book Summary";
      else if (post.category === "dzikir") categoryLabel = "Dzikir & Do'a";

      const rawText = post.summary || "";
      const shortContent = createExcerpt(rawText, 140);
      // Menggunakan ID unik postingan agar tidak pernah salah arah
      const targetLink = `article.html?id=${post.id}`;

      let coverHtml = categoryLabel;
      if (post.cover || (post.image && post.image !== "images/default.jpg")) {
        const imgSrc = post.cover || post.image;
        coverHtml = `<img src="${imgSrc}" alt="${post.title}" style="width:100%; height:100%; object-fit:cover;">`;
      }

      card.innerHTML = `
                <a href="${targetLink}" class="card-cover" style="height: 180px; background-color: #e6e5df; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #777; overflow: hidden; text-decoration: none;">
                    ${coverHtml}
                </a>
                <div class="card-body" style="padding: 24px; display: flex; flex-direction: column; flex-grow: 1;">
                    <div style="font-size: 0.85rem; color: #777; margin-bottom: 10px;">
                        ${post.date || ""} • ${categoryLabel}
                    </div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0 0 12px 0; color: #252525; line-height: 1.3;">
                        <a href="${targetLink}" style="color: inherit; text-direction: none;">${post.title}</a>
                    </h3>
                    <p style="font-size: 0.95rem; color: #555; line-height: 1.6; margin-bottom: 20px; flex-grow: 1;">
                        ${shortContent}
                    </p>
                    <a class="read" href="${targetLink}" style="font-weight: 650; color: #252525; text-decoration: none;">
                        Baca selengkapnya →
                    </a>
                </div>
            `;

      postsContainer.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const keyword = e.target.value.toLowerCase();
      const filtered = allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(keyword) ||
          (post.summary && post.summary.toLowerCase().includes(keyword)),
      );
      renderPosts(filtered);
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      filterButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const filterName = (this.getAttribute("data-filter") || this.textContent)
        .trim()
        .toLowerCase();

      if (!filterName || filterName === "all" || filterName === "semua") {
        renderPosts(allPosts);
      } else {
        const filtered = allPosts.filter((post) => {
          if (!post.category) return false;
          const postCat = post.category.toLowerCase().trim();
          const target = filterName.toLowerCase().trim();

          if (target.includes("quote") || target.includes("nasehat")) {
            return (
              postCat === "quote" ||
              postCat === "quotes" ||
              postCat === "nasehat"
            );
          }
          if (
            target.includes("cerita") ||
            target.includes("inspirasi") ||
            target.includes("story")
          ) {
            return (
              postCat === "story" ||
              postCat.includes("cerita") ||
              postCat.includes("inspirasi")
            );
          }
          if (target.includes("book") || target.includes("summary")) {
            return postCat === "book-summary" || postCat.includes("book");
          }
          return postCat === target || postCat.includes(target);
        });

        renderPosts(filtered);
      }

      const latestSection = document.getElementById("latest");
      if (latestSection) {
        latestSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  loadPosts();
});

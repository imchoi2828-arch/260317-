const KAKAO_REST_API_KEY = "15a171c1bbb5ad0f02dee3466d0e6301";

/* =========================
   콘텐츠 데이터 (고정)
========================= */
const storyData = [
  {
    title: "작가 인터뷰 | 오래 남는 문장을 쓰는 사람",
    desc: "한 권의 책 뒤에 숨어 있는 작가의 생각을 들여다봅니다.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "출판 이야기 | 한 권의 책이 만들어지는 과정",
    desc: "기획부터 편집, 디자인까지 출판 과정을 가볍게 소개합니다.",
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "큐레이션 | 요즘 독자들이 많이 찾는 책",
    desc: "지금 많이 읽히는 책들을 분야별로 정리한 추천 콘텐츠입니다.",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "북 매거진 | 차분히 읽기 좋은 책 소개",
    desc: "에세이, 소설, 인문서를 중심으로 잔잔한 추천을 담았습니다.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "에디터 노트 | 이번 달 주목할 신간",
    desc: "눈에 띄는 신간 몇 권을 골라 짧은 감상과 함께 소개합니다.",
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80"
  }
];

/* =========================
   공통 함수
========================= */
function formatPrice(price) {
  const num = Number(price);
  if (!num || num < 0) return "가격 정보 없음";
  return num.toLocaleString("ko-KR") + "원";
}

function getFallbackCover(title) {
  const encoded = encodeURIComponent(title || "BOOK");
  return `https://placehold.co/300x420/ececec/666666?text=${encoded}`;
}

function safeThumbnail(url, title) {
  if (url && url.trim() !== "") return url;
  return getFallbackCover(title);
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================
   도서 데이터 정리 함수
========================= */
function sanitizeBooks(books) {
  if (!Array.isArray(books)) return [];

  return books.filter(book => {
    const hasTitle = book.title && book.title.trim() !== "";
    const hasThumbnail = book.thumbnail && book.thumbnail.trim() !== "";
    const validPrice = Number(book.sale_price || book.price) > 0;

    return hasTitle && hasThumbnail && validPrice;
  });
}

function saveSelectedBook(book) {
  try {
    localStorage.setItem("selectedBook", JSON.stringify(book));
  } catch (error) {
    console.error("selectedBook save error", error);
  }
}

function goToBookDetail(book) {
  if (!book) return;
  saveSelectedBook(book);
  const title = encodeURIComponent(book.title || "book");
  window.location.href = `./detail.html?title=${title}`;
}

function createBookCard(book, index = 0, showRank = false) {
  const rankHTML = showRank ? `<span class="book-rank">${index + 1}</span>` : "";
  const bookJson = escapeAttr(JSON.stringify(book));

  return `
    <article class="book-card" tabindex="0" role="link" aria-label="${escapeAttr(book.title || "도서 상세 보기")}" data-book='${bookJson}'>
      ${rankHTML}
      <div class="book-thumb">
        <img src="${safeThumbnail(book.thumbnail, book.title)}" alt="${escapeAttr(book.title || "도서 이미지")}" />
      </div>
      <div class="book-meta">
        <h3 class="book-title">${book.title || "제목 없음"}</h3>
        <p class="book-author">${(book.authors || []).join(", ") || "저자 미상"}</p>
        <p class="book-price">${formatPrice(book.sale_price || book.price)}</p>
        <p class="book-publisher">${book.publisher || "출판사 정보 없음"}</p>
      </div>
    </article>
  `;
}

function bindBookCardEvents(scope = document) {
  const cards = scope.querySelectorAll(".book-card[data-book]");
  cards.forEach(card => {
    if (card.dataset.bound === "true") return;
    card.dataset.bound = "true";

    const openDetail = () => {
      try {
        const book = JSON.parse(card.dataset.book);
        goToBookDetail(book);
      } catch (error) {
        console.error("book-card parse error", error);
      }
    };

    card.addEventListener("click", openDetail);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail();
      }
    });
  });
}

function renderBooks(selector, books, options = {}) {
  const target = document.querySelector(selector);
  if (!target) return;

  if (!books || books.length === 0) {
    target.innerHTML = `<div class="empty-box">표시할 도서가 없습니다.</div>`;
    return;
  }

  target.innerHTML = books
    .map((book, index) => createBookCard(book, index, options.showRank))
    .join("");

  bindBookCardEvents(target);
}

function renderStories(selector, items) {
  const target = document.querySelector(selector);
  if (!target) return;

  target.innerHTML = items.map(item => `
    <article class="story-card">
      <img class="story-thumb" src="${item.image}" alt="${item.title}">
      <h3 class="story-title">${item.title}</h3>
      <p class="story-desc">${item.desc}</p>
    </article>
  `).join("");
}

async function fetchKakaoBooks(query, size = 12) {
  const url = `https://dapi.kakao.com/v3/search/book?target=title&query=${encodeURIComponent(query)}&size=20`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`
      }
    });

    if (!response.ok) throw new Error("카카오 API 요청 실패");

    const data = await response.json();
    const cleanedBooks = sanitizeBooks(data.documents || []);
    return cleanedBooks.slice(0, size);
  } catch (error) {
    console.error("API Fetch Error:", error);
    return [];
  }
}

/* =========================
   초기 렌더
========================= */
async function loadInitialData() {
  renderStories("#storyList", storyData);

  try {
    const searchDefault = await fetchKakaoBooks("추천도서", 6);
    renderBooks("#searchResultList", searchDefault);

    const bestDefault = await fetchKakaoBooks("베스트셀러", 6);
    renderBooks("#bestSellerList", bestDefault, { showRank: true });

    const recommendDefault = await fetchKakaoBooks("소설", 6);
    renderBooks("#recommendList", recommendDefault);

    const picksDefault = await fetchKakaoBooks("인문학", 4);
    renderBooks("#picksList", picksDefault);

    const newDefault = await fetchKakaoBooks("국내소설", 6);
    renderBooks("#newBookList", newDefault);
  } catch (error) {
    console.error("초기 데이터 로드 중 오류 발생:", error);
  }
}

/* =========================
   검색 기능
========================= */
async function handleSearch() {
  const input = document.querySelector("#searchInput");
  const resultTarget = document.querySelector("#searchResultList");

  if (!input || !resultTarget) return;

  const keyword = input.value.trim();
  if (keyword === "") {
    alert("검색어를 입력해주세요.");
    input.focus();
    return;
  }

  resultTarget.innerHTML = `<div class="loading-box">검색 중입니다...</div>`;

  try {
    const books = await fetchKakaoBooks(keyword, 12);
    if (!books.length) {
      resultTarget.innerHTML = `<div class="empty-box">검색 결과가 없습니다.</div>`;
    } else {
      renderBooks("#searchResultList", books);
      window.scrollTo({
        top: resultTarget.getBoundingClientRect().top + window.scrollY - 140,
        behavior: "smooth"
      });
    }
  } catch (error) {
    resultTarget.innerHTML = `<div class="error-box">검색 중 오류가 발생했습니다.</div>`;
  }
}

/* =========================
   탭 기능
========================= */
function activateTab(clickedButton) {
  const parent = clickedButton.parentElement;
  const siblings = parent.querySelectorAll(".pill");
  siblings.forEach(btn => btn.classList.remove("active"));
  clickedButton.classList.add("active");
}

function bindBookTabs() {
  const categoryMap = {
    all: "베스트셀러",
    novel: "소설",
    essay: "에세이",
    humanities: "인문학",
    literature: "한국문학",
    business: "경제경영",
    selfhelp: "자기계발",
    domestic: "국내소설",
    foreign: "영미소설"
  };

  const bestTabs = document.querySelectorAll("#bestTabs .pill");
  bestTabs.forEach(btn => {
    btn.addEventListener("click", async function () {
      activateTab(this);
      const query = categoryMap[this.dataset.category] || "베스트셀러";
      const books = await fetchKakaoBooks(query, 6);
      renderBooks("#bestSellerList", books, { showRank: true });
    });
  });

  const recommendTabs = document.querySelectorAll("#recommendTabs .pill");
  recommendTabs.forEach(btn => {
    btn.addEventListener("click", async function () {
      activateTab(this);
      const query = categoryMap[this.dataset.category] || "추천도서";
      const books = await fetchKakaoBooks(query, 6);
      renderBooks("#recommendList", books);
    });
  });

  const newTabs = document.querySelectorAll("#newTabs .pill");
  newTabs.forEach(btn => {
    btn.addEventListener("click", async function () {
      activateTab(this);
      const query = categoryMap[this.dataset.category] || "국내소설";
      const books = await fetchKakaoBooks(query, 6);
      renderBooks("#newBookList", books);
    });
  });
}

/* =========================
   기존 UI 이벤트
========================= */
let currentSlide = 0;
let sliderInterval = null;

function showSlide(index) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  if (!slides.length) return;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;

  slides.forEach(slide => slide.classList.remove("active"));
  dots.forEach(dot => dot.classList.remove("active"));

  slides[index].classList.add("active");
  if (dots[index]) dots[index].classList.add("active");

  currentSlide = index;
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

function prevSlide() {
  showSlide(currentSlide - 1);
}

function startSlider() {
  stopSlider();
  sliderInterval = setInterval(nextSlide, 3000);
}

function stopSlider() {
  if (sliderInterval) clearInterval(sliderInterval);
}

function bindHeroSlider() {
  const prevBtn = document.querySelector("#heroPrev");
  const nextBtn = document.querySelector("#heroNext");
  const dots = document.querySelectorAll(".hero-dot");
  const heroMain = document.querySelector(".hero-main");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startSlider();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startSlider();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener("click", function () {
      showSlide(Number(this.dataset.slide));
      startSlider();
    });
  });

  if (heroMain) {
    heroMain.addEventListener("mouseenter", stopSlider);
    heroMain.addEventListener("mouseleave", startSlider);
  }

  showSlide(0);
  startSlider();
}

function bindHeaderMenus() {
  const allMenuWrap = document.querySelector(".all-menu-wrap");
  const allMenuBtn = document.querySelector("#allMenuBtn");

  if (allMenuBtn && allMenuWrap) {
    allMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      allMenuWrap.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!allMenuWrap.contains(e.target)) {
        allMenuWrap.classList.remove("open");
      }
    });
  }
}

function bindEvents() {
  const searchBtn = document.querySelector("#searchBtn");
  const searchInput = document.querySelector("#searchInput");

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  bindEvents();
  bindBookTabs();
  bindHeroSlider();
  bindHeaderMenus();

  if (document.querySelector("#searchResultList")) {
    loadInitialData();
  }
});
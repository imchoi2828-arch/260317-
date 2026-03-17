function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSelectedBook() {
  try {
    const saved = localStorage.getItem("selectedBook");
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error("selectedBook parse error", error);
  }
  return null;
}

function buildDummyContents(title) {
  return [
    `${title || "이 책"}을 펼치며`,
    "첫 번째 장면",
    "관계와 감정의 흐름",
    "마음에 오래 남는 문장들",
    "마지막 페이지 이후"
  ];
}

function buildDummyReviews(book) {
  const author = (book.authors || [])[0] || "작가";
  return [
    {
      name: "forest_reader",
      rating: 5,
      text: `${escapeHtml(book.title || "이 책")}은(는) 첫 장부터 몰입감이 좋았어요. ${author}의 문장이 부드럽고 읽는 흐름이 자연스러워서 끝까지 편하게 읽혔습니다.`
    },
    {
      name: "book_day",
      rating: 4,
      text: "표지 분위기와 내용의 결이 잘 맞아서 만족스러웠어요. 감정선이 차분하게 이어져서 천천히 읽기 좋은 책입니다."
    },
    {
      name: "page_note",
      rating: 5,
      text: "책 소개에 끌려 선택했는데 기대 이상이었습니다. 문장과 주제가 선명해서 메모해두고 싶은 부분이 많았어요."
    }
  ];
}

function buildBookIntro(book) {
  const title = book.title || "제목 없음";
  const authors = (book.authors || []).join(", ") || "저자 미상";
  const publisher = book.publisher || "출판사 정보 없음";
  const contents = book.contents || "";

  return `
    <p><strong>${escapeHtml(title)}</strong>는 ${escapeHtml(authors)}의 작품으로, ${escapeHtml(publisher)}에서 소개하는 도서입니다.</p>
    <p>${escapeHtml(contents || "카카오 도서 검색 API에서 제공되는 소개 문구가 여기에 표시됩니다. 실제 서비스처럼 길게 보이도록 여백과 문단 구성을 넣었습니다.")}</p>
    <p>상세 페이지에서는 메인 화면에서 클릭한 책 정보를 그대로 이어 받아, 표지·제목·저자·가격·기본 정보가 한 번에 보이도록 구성했습니다. 상단 로고를 누르면 언제든 다시 메인으로 돌아갈 수 있습니다.</p>
  `;
}

function buildAuthorInfo(book) {
  const authors = (book.authors || []).join(", ") || "저자 정보 없음";
  const translators = (book.translators || []).join(", ");

  return `
    <p><strong>저자</strong> : ${escapeHtml(authors)}</p>
    ${translators ? `<p><strong>역자</strong> : ${escapeHtml(translators)}</p>` : ""}
    <p>이 영역은 작가 소개 영역으로 사용할 수 있도록 길게 보이는 레이아웃으로 구성했습니다. 현재는 API에서 받은 저자명을 중심으로 표시하지만, 나중에 직접 데이터를 추가하면 작가 약력이나 대표작 목록도 넣을 수 있습니다.</p>
  `;
}

function renderDetailHero(book) {
  const hero = document.querySelector("#detailHero");
  if (!hero) return;

  const authors = (book.authors || []).join(", ") || "저자 미상";
  const translators = (book.translators || []).join(", ");
  const title = book.title || "제목 없음";
  const salePrice = book.sale_price || 0;
  const price = book.price || 0;
  const discountRate = price > salePrice && salePrice > 0 ? Math.round(((price - salePrice) / price) * 100) : 0;
  const reviewScore = ((title.length % 8) + 2).toFixed(1);

  hero.innerHTML = `
    <div class="detail-cover-panel">
      <div class="detail-cover-sticky">
        <div class="detail-cover-frame">
          <img ${createResponsiveImageAttrs(book)} alt="${escapeHtml(title)}" class="detail-cover-image" />
        </div>
      </div>
    </div>

    <div class="detail-summary-panel">
      <span class="detail-badge">오늘의 선택</span>
      <h1 class="detail-title">${escapeHtml(title)}</h1>
      <p class="detail-author-line">${escapeHtml(authors)} ${translators ? `· ${escapeHtml(translators)} 옮김` : ""}</p>
      <p class="detail-publisher-line">${escapeHtml(book.publisher || "출판사 정보 없음")} · ${escapeHtml((book.datetime || "").slice(0, 10) || "출간일 정보 없음")}</p>

      <div class="detail-rating-row">
        <strong>${reviewScore}</strong>
        <span>리뷰 124</span>
        <span>·</span>
        <span>구매자 평점</span>
      </div>

      <div class="detail-short-desc">
        ${escapeHtml(book.contents || "책의 핵심 소개 문구가 이 영역에 들어갑니다. 메인에서 클릭한 도서를 기준으로 상세 화면을 구성합니다.")}
      </div>

      <div class="detail-meta-chips">
        <span class="detail-chip">ISBN ${escapeHtml(book.isbn || "정보 없음")}</span>
        <span class="detail-chip">상태 ${escapeHtml(book.status || "정상판매")}</span>
        <span class="detail-chip">${book.sale_price ? "할인가 적용" : "정가 판매"}</span>
      </div>
    </div>

    <aside class="detail-buy-panel">
      <div class="detail-buy-card">
        <div class="detail-price-row">
          ${discountRate ? `<span class="detail-discount">${discountRate}%</span>` : ""}
          <strong>${formatPrice(salePrice || price)}</strong>
        </div>
        ${salePrice && price && salePrice !== price ? `<p class="detail-origin-price">정가 ${formatPrice(price)}</p>` : ""}
        <div class="detail-point-box">
          <span>적립</span>
          <strong>${Math.max(100, Math.round((salePrice || price) * 0.05)).toLocaleString("ko-KR")}P</strong>
        </div>
        <div class="detail-buy-actions">
          <button class="buy-btn secondary">선물하기</button>
          <button class="buy-btn secondary">장바구니</button>
          <button class="buy-btn primary">바로구매</button>
        </div>
        <a href="./index.html" class="detail-home-link">← 메인 화면으로 돌아가기</a>
      </div>
    </aside>
  `;

  const breadcrumb = document.querySelector("#detailBreadcrumb");
  if (breadcrumb) breadcrumb.textContent = `홈 > 도서 > ${title}`;

  const reviewScoreBox = document.querySelector("#detailReviewScore");
  if (reviewScoreBox) {
    reviewScoreBox.innerHTML = `<strong>${reviewScore}</strong><span>구매자 만족도</span>`;
  }
}

function renderDetailSections(book) {
  const title = book.title || "제목 없음";
  const banner = document.querySelector("#detailIntroBannerInner");
  const intro = document.querySelector("#detailIntroText");
  const author = document.querySelector("#detailAuthorText");
  const indexList = document.querySelector("#detailIndexList");
  const infoGrid = document.querySelector("#detailInfoGrid");
  const reviewList = document.querySelector("#detailReviewList");

  if (banner) {
    banner.innerHTML = `
      <div class="detail-visual-banner">
        <div class="detail-visual-copy">
          <span>BOOK FOREST CURATION</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(book.contents || "마음을 오래 붙잡는 문장을 가진 책을 위한 상세 소개 영역입니다.")}</p>
        </div>
        <div class="detail-visual-book">
          <img ${createResponsiveImageAttrs(book)} alt="${escapeHtml(title)}" class="detail-visual-book-image" />
        </div>
      </div>
    `;
  }

  if (intro) intro.innerHTML = buildBookIntro(book);
  if (author) author.innerHTML = buildAuthorInfo(book);

  if (indexList) {
    indexList.innerHTML = buildDummyContents(title)
      .map((item, idx) => `<div class="detail-index-item"><span>${String(idx + 1).padStart(2, "0")}</span><strong>${escapeHtml(item)}</strong></div>`)
      .join("");
  }

  if (infoGrid) {
    const infoItems = [
      ["제목", title],
      ["저자", (book.authors || []).join(", ") || "저자 미상"],
      ["출판사", book.publisher || "정보 없음"],
      ["정가", formatPrice(book.price)],
      ["판매가", formatPrice(book.sale_price || book.price)],
      ["ISBN", book.isbn || "정보 없음"],
      ["출간일", (book.datetime || "").slice(0, 10) || "정보 없음"],
      ["상태", book.status || "정상판매"],
      ["상세 링크", book.url ? `<a href="${book.url}" target="_blank" rel="noopener noreferrer">카카오 제공 링크 보기</a>` : "정보 없음"]
    ];

    infoGrid.innerHTML = infoItems.map(([label, value]) => `
      <div class="detail-info-item">
        <span>${escapeHtml(label)}</span>
        <strong>${typeof value === "string" && value.includes("<a ") ? value : escapeHtml(value)}</strong>
      </div>
    `).join("");
  }

  if (reviewList) {
    reviewList.innerHTML = buildDummyReviews(book).map(item => `
      <article class="detail-review-card">
        <div class="detail-review-top">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</span>
        </div>
        <p>${item.text}</p>
      </article>
    `).join("");
  }
}

async function loadRelatedBooks(book) {
  const query = ((book.authors || [])[0] || book.title || "추천도서").trim();
  const books = await fetchKakaoBooks(query, 4);
  const filtered = books.filter(item => item.title !== book.title).slice(0, 4);
  renderBooks("#relatedBooksList", filtered.length ? filtered : books.slice(0, 4));
}

async function searchAndMove() {
  const input = document.querySelector("#detailSearchInput");
  if (!input) return;
  const keyword = input.value.trim();
  if (!keyword) {
    alert("검색어를 입력해주세요.");
    input.focus();
    return;
  }

  const books = await fetchKakaoBooks(keyword, 1);
  if (!books.length) {
    alert("검색 결과가 없습니다.");
    return;
  }

  localStorage.setItem("selectedBook", JSON.stringify(books[0]));
  window.location.href = `./detail.html?title=${encodeURIComponent(books[0].title || keyword)}`;
}

async function initDetailPage() {
  const hero = document.querySelector("#detailHero");
  if (!hero) return;

  let book = getSelectedBook();
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title");

  if ((!book || (title && book.title !== title)) && title) {
    const result = await fetchKakaoBooks(title, 1);
    if (result.length) {
      book = result[0];
      localStorage.setItem("selectedBook", JSON.stringify(book));
    }
  }

  if (!book) {
    hero.innerHTML = `
      <div class="detail-empty-state">
        <h2>선택된 도서가 없습니다.</h2>
        <p>메인 페이지에서 책 카드를 클릭하면 상세 페이지로 이동하도록 연결해두었습니다.</p>
        <a href="./index.html" class="btn-primary detail-empty-link">메인으로 이동</a>
      </div>
    `;
    return;
  }

  renderDetailHero(book);
  renderDetailSections(book);
  bindSmartImages(document);
  await loadRelatedBooks(book);

  const searchBtn = document.querySelector("#detailSearchBtn");
  const searchInput = document.querySelector("#detailSearchInput");
  if (searchBtn) searchBtn.addEventListener("click", searchAndMove);
  if (searchInput) searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchAndMove();
  });
}

document.addEventListener("DOMContentLoaded", initDetailPage);

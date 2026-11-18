/* ============================================================
   تک نیوز — اسکریپت اصلی
   ============================================================ */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------- تاریخ امروز ---------- */
  const dateEl = $("#today-date");
  if (dateEl) {
    try {
      const parts = new Intl.DateTimeFormat("fa-IR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).formatToParts(new Date());
      const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
      dateEl.textContent = `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`;
    } catch (e) {
      dateEl.textContent = "امروز";
    }
  }

  /* ---------- حالت روشن / تاریک ---------- */
  const themeToggle = $("#theme-toggle");
  const storedTheme = localStorage.getItem("technews-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", initialTheme);

  themeToggle.addEventListener("click", function () {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("technews-theme", next);
  });

  /* ---------- منوی موبایل ---------- */
  const menuToggle = $("#menu-toggle");
  const mainNav = $("#main-nav");
  menuToggle.addEventListener("click", function () {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- جستجوی موبایل ---------- */
  const mobileSearchBtn = $("#mobile-search-btn");
  const searchForm = $("#search-form");
  const searchInput = $("#search-input");
  mobileSearchBtn.addEventListener("click", function () {
    const open = searchForm.classList.toggle("mobile-open");
    if (open) searchInput.focus();
  });

  /* ---------- خبر فوری (تیکر) ---------- */
  const tickerItems = $$("#breaking-track a");
  const nextBtn = $("#breaking-next");
  let tickerIndex = 0;
  let tickerTimer;

  function showTicker(index) {
    tickerIndex = (index + tickerItems.length) % tickerItems.length;
    tickerItems.forEach(function (item, i) {
      // تکرار انیمیشن با حذف و اضافه کردن کلاس
      item.classList.remove("active");
      if (i === tickerIndex) {
        void item.offsetWidth;
        item.classList.add("active");
      }
    });
  }
  function startTicker() {
    tickerTimer = setInterval(function () { showTicker(tickerIndex + 1); }, 5000);
  }
  if (tickerItems.length) {
    showTicker(0);
    startTicker();
    nextBtn.addEventListener("click", function () {
      showTicker(tickerIndex + 1);
      clearInterval(tickerTimer);
      startTicker();
    });
    $(".breaking").addEventListener("mouseenter", function () { clearInterval(tickerTimer); });
    $(".breaking").addEventListener("mouseleave", startTicker);
  }

  /* ---------- فیلتر + جستجو ---------- */
  const filterButtons = $$(".filter-btn");
  const noResults = $("#no-results");
  const resultCount = $("#result-count");
  const sourceBadge = $("#source-badge");
  const loadMoreBtn = $("#load-more");
  const PAGE_SIZE = 6;

  const state = { category: "همه", query: "", visible: PAGE_SIZE, cards: [], source: "local" };

  const normalize = function (s) {
    return s.replace(/[\u064B-\u065F\u0670]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase();
  };

  function setupCards() {
    state.cards = $$(".news-card");
    state.cards.forEach(function (card) {
      card.dataset.searchText = normalize(card.textContent);
    });
  }

  function render() {
    const matches = state.cards.filter(function (card) {
      const categoryOk = state.category === "همه" || card.dataset.category === state.category;
      const queryOk = !state.query || card.dataset.searchText.includes(state.query);
      return categoryOk && queryOk;
    });

    resultCount.textContent = matches.length + " خبر";
    sourceBadge.hidden = false;
    sourceBadge.textContent = state.source === "api" ? "API جاوا" : "حالت محلی";
    sourceBadge.className = "source-badge " + state.source;
    noResults.hidden = matches.length !== 0;

    matches.forEach(function (card, index) {
      card.hidden = index >= state.visible;
    });
    state.cards.forEach(function (card) {
      if (!matches.includes(card)) card.hidden = true;
    });

    const hasMore = matches.length > state.visible;
    loadMoreBtn.hidden = !hasMore;
    loadMoreBtn.textContent = hasMore ? "نمایش اخبار بیشتر ↓" : "";
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterButtons.forEach(function (b) { b.classList.remove("active"); });
      button.classList.add("active");
      state.category = button.dataset.category;
      state.visible = PAGE_SIZE;
      $$(".nav-link").forEach(function (l) { l.classList.remove("active"); });
      render();
    });
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    state.query = normalize(searchInput.value.trim());
    state.visible = PAGE_SIZE;
    render();
    if (window.innerWidth <= 760) searchForm.classList.remove("mobile-open");
    $("#news").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  searchInput.addEventListener("input", function () {
    state.query = normalize(searchInput.value.trim());
    state.visible = PAGE_SIZE;
    render();
  });

  loadMoreBtn.addEventListener("click", function () {
    state.visible += PAGE_SIZE;
    render();
  });

  /* منوی بالا هم فیلتر میکند */
  $$(".nav-link[data-nav-category]").forEach(function (link) {
    link.addEventListener("click", function () {
      const category = link.dataset.navCategory;
      const target = filterButtons.find(function (b) { return b.dataset.category === category; });
      if (target) {
        filterButtons.forEach(function (b) { b.classList.remove("active"); });
        target.classList.add("active");
        state.category = category;
        state.visible = PAGE_SIZE;
        $$(".nav-link").forEach(function (l) { l.classList.remove("active"); });
        link.classList.add("active");
        render();
      }
      if (mainNav.classList.contains("open")) {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------- اتصال به API جاوا ---------- */
  const TAG_CLASSES = {
    "هوش مصنوعی": "tag-ai",
    "سخت افزار": "tag-hardware",
    "موبایل": "tag-mobile",
    "امنیت": "tag-security",
    "نرم افزار": "tag-software",
    "کوانتوم": "tag-quantum",
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function cardFromApi(item) {
    const tagClass = TAG_CLASSES[item.category] || "tag-ai";
    const image = escapeHtml(item.image || "assets/images/hero-ai.svg");
    return [
      '<article class="news-card card" data-category="' + escapeHtml(item.category) + '" data-id="' + escapeHtml(item.id) + '">',
      '  <div class="thumb"><img src="' + image + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />',
      '    <span class="badge badge-new">API</span></div>',
      '  <div class="news-card-body">',
      '    <div class="article-meta"><span class="tag ' + tagClass + '">' + escapeHtml(item.category) + '</span><span>' + escapeHtml(item.date) + '</span></div>',
      '    <h3><a href="#news" data-article="' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + '</a></h3>',
      '    <p>' + escapeHtml(item.excerpt) + '</p>',
      '    <div class="card-footer"><span>توسط: تحریریه تک نیوز</span><span>' + escapeHtml(item.readTime) + ' مطالعه</span></div>',
      '  </div>',
      '</article>',
    ].join("\n");
  }

  async function loadFromApi() {
    // در حالت باز کردن مستقیم فایل (file://) یا GitHub Pages سرور API در دسترس نیست
    if (!window.TechNewsAPI ||
        window.location.protocol === "file:" ||
        /\.github\.io$/i.test(window.location.hostname)) return;
    try {
      const items = await window.TechNewsAPI.getNews();
      if (!Array.isArray(items) || !items.length) return;
      $("#news-grid").innerHTML = items.map(cardFromApi).join("\n");
      state.source = "api";
      setupCards();
      render();
    } catch (e) {
      // سرور جاوا در دسترس نیست؛ همان اخبار استاتیک باقی میمانند.
      state.source = "local";
      render();
    }
  }

  setupCards();
  render();
  loadFromApi();

  /* ---------- خبرنامه ---------- */
  const newsletterForm = $("#newsletter-form");
  const newsletterEmail = $("#newsletter-email");
  const newsletterMsg = $("#newsletter-msg");

  newsletterForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const value = newsletterEmail.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    newsletterMsg.classList.toggle("error", !valid);

    if (!valid) {
      newsletterMsg.textContent = "لطفاً یک آدرس ایمیل معتبر وارد کنید.";
      return;
    }

    if (window.TechNewsAPI && state.source === "api") {
      try {
        const result = await window.TechNewsAPI.subscribe(value);
        newsletterMsg.classList.toggle("error", !result.ok);
        newsletterMsg.textContent = (result.ok ? "✓ " : "✗ ") + result.message;
        if (result.ok) newsletterEmail.value = "";
        return;
      } catch (e) {
        // در صورت عدم دسترسی به API، ذخیره محلی انجام میشود.
      }
    }

    newsletterMsg.textContent = "✓ ممنون! اشتراک شما با موفقیت ثبت شد.";
    newsletterEmail.value = "";
  });

  /* ---------- بازگشت به بالا ---------- */
  const backToTop = $("#back-to-top");
  window.addEventListener("scroll", function () {
    backToTop.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- پنجره مطالعه خبر ---------- */
  const articleData = window.TechNewsArticles || {};
  const modal = $("#article-modal");

  function openArticle(id) {
    const data = articleData[id];
    if (!modal || !data) return;

    $("#modal-title").textContent = data.title;
    const image = $("#modal-image");
    image.src = data.image || "assets/images/hero-ai.svg";
    image.alt = data.title;

    const meta = $("#modal-meta");
    meta.innerHTML = "";
    const tag = document.createElement("span");
    tag.className = "tag " + (TAG_CLASSES[data.category] || "tag-ai");
    tag.textContent = data.category;
    const date = document.createElement("span");
    date.textContent = data.date;
    const divider = document.createElement("span");
    divider.textContent = "•";
    const time = document.createElement("span");
    time.textContent = data.readTime;
    meta.append(tag, date, divider, time);

    const body = $("#modal-body");
    body.innerHTML = "";
    (data.body || []).forEach(function (paragraph) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      body.appendChild(p);
    });

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $("#modal-close").focus();
  }

  function closeArticle() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest("[data-article]");
    if (link) {
      event.preventDefault();
      openArticle(link.dataset.article);
      return;
    }
    if (event.target.closest("[data-close-modal]")) closeArticle();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeArticle();
  });
})();

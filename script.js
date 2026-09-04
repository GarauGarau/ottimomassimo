const BOOKS = Array.isArray(window.BOOKS) ? window.BOOKS : [];

const STAR_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.3 L14.7 8.4 L21.4 9.5 L16.5 14.1 L17.8 20.8 L12 17.6 L6.2 21.2 L7.4 14.2 L2.5 9.4 L9.3 8.6 Z" />
  </svg>`;

const THEME_SYNONYMS = {
  amore: ["desiderio", "gelosia", "affetti", "matrimonio"],
  famiglia: ["genitori", "figli", "padre", "madre"],
  figli: ["famiglia", "genitori", "padre", "madre", "responsabilità"],
  lavoro: ["insegnamento", "sfruttamento", "ranch"],
  natura: ["terra", "campagna", "radici"],
  magia: ["destino", "sogno", "inspiegabili", "bene e male"],
  memoria: ["ricordi", "radici", "ritorno", "tempo"],
  liberta: ["libertà", "censura", "esilio", "potere"],
  sogno: ["illusione", "immaginazione", "destino"],
  poverta: ["povertà", "migrazione", "emarginazione"],
  vita: ["quotidiana", "solitudine", "tempo"]
};

let currentQuery = "";
let visibleBooks = [...BOOKS];
let currentIndex = 0;
let currentQuoteIndex = 0;
let lastFocused = null;

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBookQuotes(book) {
  const quotes = Array.isArray(book.quotes) ? book.quotes : [book.quote];
  return quotes.filter((quote) => typeof quote === "string" && quote.trim());
}

function bookMatchesQuery(book, query) {
  const text = normalize([
    book.title,
    book.author,
    ...getBookQuotes(book),
    ...book.themes
  ].join(" "));

  return normalize(query).split(" ").filter(Boolean).every((token) => {
    if (text.includes(token)) return true;
    const relatedWords = THEME_SYNONYMS[token] || [];
    return relatedWords.some((word) => text.includes(normalize(word)));
  });
}

function renderStars(count) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const state = index < count ? "filled" : "empty";
    return `<span class="star ${state}">${STAR_SVG}</span>`;
  }).join("");

  return `<span class="stars" aria-label="Voto ${count} su 5">${stars}</span>`;
}

function renderBookCard(book) {
  const title = escapeHTML(book.title);
  const author = escapeHTML(book.author);

  return `
    <button class="book" type="button" data-book-id="${escapeHTML(book.id)}" aria-label="Apri la scheda di ${title}">
      <span class="cover-wrap">
        <img src="${escapeHTML(book.cover)}" alt="Copertina di ${title}" loading="lazy" />
      </span>
      <span class="book-title">${title}</span>
      <span class="book-author">${author}</span>
      ${renderStars(book.stars)}
      <span class="book-tooltip" aria-hidden="true">vai in libreria a cercarlo!</span>
    </button>`;
}

function renderGrid(books) {
  const grid = document.getElementById("book-grid");
  grid.innerHTML = books.map(renderBookCard).join("");

  grid.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
      image.parentElement.classList.add("cover-missing");
    }, { once: true });
  });
}

function updateSearch(query) {
  currentQuery = query.trim();
  visibleBooks = currentQuery
    ? BOOKS.filter((book) => bookMatchesQuery(book, currentQuery))
    : [...BOOKS];

  const emptyState = document.getElementById("empty-state");
  const resultMessage = document.getElementById("search-result-msg");
  renderGrid(visibleBooks);

  emptyState.hidden = visibleBooks.length > 0;
  if (!currentQuery || visibleBooks.length === 0) {
    resultMessage.hidden = true;
    return;
  }

  resultMessage.hidden = false;
  resultMessage.textContent = visibleBooks.length === 1
    ? `trovato 1 libro per “${currentQuery}”`
    : `trovati ${visibleBooks.length} libri per “${currentQuery}”`;
}

function resetSearch() {
  const input = document.getElementById("search-input");
  const clearButton = document.getElementById("search-clear");
  input.value = "";
  clearButton.hidden = true;
  updateSearch("");
  input.focus();
}

function setupSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const clearButton = document.getElementById("search-clear");

  form.addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", () => {
    clearButton.hidden = input.value.length === 0;
    updateSearch(input.value);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value) resetSearch();
  });
  clearButton.addEventListener("click", resetSearch);
  document.getElementById("reset-search").addEventListener("click", resetSearch);

  document.querySelectorAll(".hint-pill").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.q;
      clearButton.hidden = false;
      updateSearch(button.dataset.q);
      input.focus();
    });
  });
}

function renderModalContent() {
  const book = visibleBooks[currentIndex];
  if (!book) return;

  const quotes = getBookQuotes(book);
  const quote = quotes[currentQuoteIndex] || "";
  const quoteControls = quotes.length > 1
    ? `<nav class="quote-pagination" aria-label="Scorri le citazioni">
        <button type="button" class="quote-arrow" data-quote-step="-1" aria-label="Citazione precedente"><span aria-hidden="true">&lt;</span></button>
        <span class="quote-counter" id="quote-counter" aria-live="polite">${currentQuoteIndex + 1}/${quotes.length}</span>
        <button type="button" class="quote-arrow" data-quote-step="1" aria-label="Citazione successiva"><span aria-hidden="true">&gt;</span></button>
      </nav>`
    : "";

  const themes = book.themes
    .map((theme) => `<li class="theme-tag">${escapeHTML(theme)}</li>`)
    .join("");

  document.getElementById("modal-content").innerHTML = `
    <div class="detail-layout">
      <div class="detail-cover-wrap">
        <img src="${escapeHTML(book.cover)}" alt="Copertina di ${escapeHTML(book.title)}" />
      </div>
      <div class="detail-copy">
        <h2 class="detail-title" id="modal-title">${escapeHTML(book.title)}</h2>
        <p class="detail-author">di ${escapeHTML(book.author)}</p>
        <div class="detail-meta">
          <span class="detail-year">${book.year}</span>
          ${renderStars(book.stars)}
        </div>
        <div class="detail-quote-frame">
          <blockquote class="detail-quote" id="detail-quote-text" aria-label="Citazione ${currentQuoteIndex + 1} di ${quotes.length}">${escapeHTML(quote)}</blockquote>
          ${quoteControls}
        </div>
        <div class="detail-themes">
          <h3>I temi che ho trovato leggendolo</h3>
          <ul class="themes-list">${themes}</ul>
        </div>
        <button type="button" class="where-button" id="where-button" aria-haspopup="dialog">Dove comprarlo?</button>
      </div>
    </div>`;
}

function openModal(bookId) {
  const index = visibleBooks.findIndex((book) => book.id === bookId);
  if (index < 0) return;

  currentIndex = index;
  currentQuoteIndex = 0;
  lastFocused = document.activeElement;
  renderModalContent();
  const modal = document.getElementById("modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  window.setTimeout(() => modal.querySelector(".modal-close").focus(), 30);
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  lastFocused?.focus();
}

function navigateBooks(step) {
  if (visibleBooks.length === 0) return;
  currentIndex = (currentIndex + step + visibleBooks.length) % visibleBooks.length;
  currentQuoteIndex = 0;
  renderModalContent();
}

function navigateQuotes(step) {
  const book = visibleBooks[currentIndex];
  const quotes = getBookQuotes(book);
  if (quotes.length < 2) return;

  currentQuoteIndex = (currentQuoteIndex + step + quotes.length) % quotes.length;
  const quoteElement = document.getElementById("detail-quote-text");
  const quoteCounter = document.getElementById("quote-counter");
  quoteElement.textContent = quotes[currentQuoteIndex];
  quoteElement.setAttribute("aria-label", `Citazione ${currentQuoteIndex + 1} di ${quotes.length}`);
  quoteCounter.textContent = `${currentQuoteIndex + 1}/${quotes.length}`;
}

function setPopupState(popup, open, returnFocus) {
  popup.classList.toggle("open", open);
  popup.setAttribute("aria-hidden", String(!open));
  const modalIsOpen = document.getElementById("modal").classList.contains("open");
  document.body.classList.toggle("no-scroll", open || modalIsOpen);

  if (open) {
    window.setTimeout(() => popup.querySelector(".popup-close").focus(), 30);
  } else {
    returnFocus?.focus();
  }
}

function setupDialogs() {
  const modal = document.getElementById("modal");
  const wherePopup = document.getElementById("where-popup");
  const selectionPopup = document.getElementById("selection-popup");
  const selectionButton = document.getElementById("selection-btn");

  document.getElementById("book-grid").addEventListener("click", (event) => {
    const book = event.target.closest(".book");
    if (book) openModal(book.dataset.bookId);
  });
  document.getElementById("modal-content").addEventListener("click", (event) => {
    const quoteButton = event.target.closest("[data-quote-step]");
    if (quoteButton) navigateQuotes(Number(quoteButton.dataset.quoteStep));
  });
  modal.querySelectorAll("[data-close]").forEach((element) => element.addEventListener("click", closeModal));
  document.getElementById("prev-book").addEventListener("click", () => navigateBooks(-1));
  document.getElementById("next-book").addEventListener("click", () => navigateBooks(1));

  document.addEventListener("click", (event) => {
    const whereButton = event.target.closest("#where-button");
    if (whereButton) setPopupState(wherePopup, true, whereButton);
  });
  wherePopup.querySelectorAll("[data-where-close]").forEach((element) => {
    element.addEventListener("click", () => setPopupState(wherePopup, false, document.getElementById("where-button")));
  });

  selectionButton.addEventListener("click", () => setPopupState(selectionPopup, true, selectionButton));
  selectionPopup.querySelectorAll("[data-selection-close]").forEach((element) => {
    element.addEventListener("click", () => setPopupState(selectionPopup, false, selectionButton));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      if (modal.classList.contains("open") && event.key === "ArrowLeft") navigateBooks(-1);
      if (modal.classList.contains("open") && event.key === "ArrowRight") navigateBooks(1);
      return;
    }

    if (wherePopup.classList.contains("open")) {
      setPopupState(wherePopup, false, document.getElementById("where-button"));
    } else if (selectionPopup.classList.contains("open")) {
      setPopupState(selectionPopup, false, selectionButton);
    } else if (modal.classList.contains("open")) {
      closeModal();
    }
  });

  let touchStartX = 0;
  modal.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });
  modal.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 60) navigateBooks(distance > 0 ? -1 : 1);
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  renderGrid(BOOKS);
  setupSearch();
  setupDialogs();
});

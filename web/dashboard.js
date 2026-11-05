/**
 * dashboard.js
 * PWA Dashboard — all view logic for the Scripture & Quiet-Time Suite.
 *
 * Views: daily, catalog, bookmarks, configurator
 * Persistence: localStorage keys  sqts_theme / sqts_bookmarks
 *
 * Requirements: 9.1–9.6, 11.3, 11.4, 12.1–12.5
 */

import {
  initEngine,
  getDailyVerse,
  getRandomVerse,
  getVerseText,
  groupByCategory,
  filterByCategory,
} from './scriptureEngine.js';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const THEME_KEY     = 'sqts_theme';
const BOOKMARK_KEY  = 'sqts_bookmarks';

// ---------------------------------------------------------------------------
// HTML escape utility
// ---------------------------------------------------------------------------

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Bookmark helpers — exported for property tests P13, P14, P15
// ---------------------------------------------------------------------------

/**
 * Loads the bookmark list from localStorage. Returns an empty array on error.
 *
 * @returns {string[]}
 */
export function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persists the bookmark list to localStorage.
 *
 * @param {string[]} ids
 */
export function saveBookmarks(ids) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — fail silently
  }
}

/**
 * Toggles `id` in the bookmark list: adds if absent, removes if present.
 * Guarantees no duplicate ids.
 * Returns the new bookmark list.
 *
 * @param {string} id
 * @param {string[]} currentIds
 * @returns {string[]}
 */
export function toggleBookmark(id, currentIds) {
  const idx = currentIds.indexOf(id);
  if (idx === -1) {
    // Add — only if not already present (defensive dedup)
    return [...new Set([...currentIds, id])];
  } else {
    return currentIds.filter((x) => x !== id);
  }
}

/**
 * Returns all entries from `allEntries` whose `id` is in `ids`.
 *
 * @param {string[]} ids
 * @param {import('../shared/scriptureEngine').VerseEntry[]} allEntries
 * @returns {import('../shared/scriptureEngine').VerseEntry[]}
 */
export function getBookmarkedVerses(ids, allEntries) {
  const idSet = new Set(ids);
  return allEntries.filter((e) => idSet.has(e.id));
}

// ---------------------------------------------------------------------------
// Theme helpers — exported for property test P9 (dashboard surface)
// ---------------------------------------------------------------------------

/**
 * Returns the stored theme or 'light' as default.
 *
 * @returns {'light' | 'dark'}
 */
export function readStoredTheme() {
  try {
    const val = localStorage.getItem(THEME_KEY);
    return val === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Persists the theme and applies it to the document root.
 *
 * @param {'light' | 'dark'} theme
 */
export function applyTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // fail silently
  }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
    // Update aria-pressed on both theme toggle buttons
    document.querySelectorAll('.btn-theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }
}

// ---------------------------------------------------------------------------
// Daily view render helper — exported for property test P7 (dashboard)
// ---------------------------------------------------------------------------

/**
 * Builds an HTML string for the daily verse card content.
 * Also updates the live DOM when running in a browser context.
 *
 * @param {import('../shared/scriptureEngine').VerseEntry} entry
 * @returns {string} HTML string with all five required fields
 */
export function renderDailyCard(entry, translation = 'NIV') {
  const text             = getVerseText(entry, translation);
  const translationLabel = entry.translations ? translation : (entry.translation ?? '');
  const referenceHtml    = `<p class="verse-reference">${escapeHtml(entry.reference)}</p>`;
  const textHtml         = `<blockquote class="verse-text"><p>${escapeHtml(text)}</p></blockquote>`;
  const translationHtml  = `<span class="verse-translation">${escapeHtml(translationLabel)}</span>`;
  const reflectionHtml   = `<p class="verse-reflection">${escapeHtml(entry.reflection)}</p>`;
  const promptHtml       = `<p class="verse-prompt">${escapeHtml(entry.quietTimePrompt)}</p>`;

  const html = referenceHtml + textHtml + translationHtml + reflectionHtml + promptHtml;

  // Update live DOM elements when running in a browser
  if (typeof document !== 'undefined') {
    const refEl    = document.getElementById('daily-reference');
    const textEl   = document.getElementById('daily-text-content');
    const transEl  = document.getElementById('daily-translation');
    const reflEl   = document.getElementById('daily-reflection');
    const promptEl = document.getElementById('daily-prompt');
    const cardEl   = document.getElementById('daily-verse-card');
    const bkmBtn   = document.getElementById('btn-bookmark-daily');

    if (refEl)    refEl.textContent    = entry.reference;
    if (textEl)   textEl.textContent   = text;
    if (transEl)  transEl.textContent  = translationLabel;
    if (reflEl)   reflEl.textContent   = entry.reflection;
    if (promptEl) promptEl.textContent = entry.quietTimePrompt;
    if (cardEl)   cardEl.classList.remove('verse-card--loading');
    if (bkmBtn)   bkmBtn.dataset.verseId = entry.id;
  }

  return html;
}

// ---------------------------------------------------------------------------
// Toast / error notification
// ---------------------------------------------------------------------------

let _toastTimer = null;

/**
 * Shows a brief toast message.
 *
 * @param {string} message
 * @param {number} [duration=3000]
 */
function showToast(message, duration = 3000) {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.hidden = false;

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, duration);
}

// ---------------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------------

const VIEWS = ['daily', 'catalog', 'bookmarks', 'configurator'];

/**
 * Shows the named view and hides the rest.
 * Updates aria-current on nav links.
 *
 * @param {string} viewName
 */
function switchToView(viewName) {
  if (!VIEWS.includes(viewName)) return;

  for (const name of VIEWS) {
    const section = document.getElementById(`view-${name}`);
    if (!section) continue;
    if (name === viewName) {
      section.hidden = false;
      section.classList.add('view--active');
    } else {
      section.hidden = true;
      section.classList.remove('view--active');
    }
  }

  // Update nav link aria states
  document.querySelectorAll('[data-view]').forEach((link) => {
    const isActive = link.dataset.view === viewName;
    link.classList.toggle('nav-desktop__link--active',  isActive && link.classList.contains('nav-desktop__link'));
    link.classList.toggle('nav-bottom__link--active',   isActive && link.classList.contains('nav-bottom__link'));
    link.classList.toggle('mobile-menu__link--active',  isActive && link.classList.contains('mobile-menu__link'));
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Close mobile menu if open
  closeMobileMenu();
}

// ---------------------------------------------------------------------------
// Mobile menu
// ---------------------------------------------------------------------------

function openMobileMenu() {
  const menu    = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  const btn     = document.getElementById('hamburger-btn');
  if (menu)    { menu.removeAttribute('aria-hidden'); menu.classList.add('mobile-menu--open'); }
  if (overlay) { overlay.removeAttribute('aria-hidden'); }
  if (btn)     { btn.setAttribute('aria-expanded', 'true'); }
}

function closeMobileMenu() {
  const menu    = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  const btn     = document.getElementById('hamburger-btn');
  if (menu)    { menu.setAttribute('aria-hidden', 'true'); menu.classList.remove('mobile-menu--open'); }
  if (overlay) { overlay.setAttribute('aria-hidden', 'true'); }
  if (btn)     { btn.setAttribute('aria-expanded', 'false'); }
}

// ---------------------------------------------------------------------------
// Catalog view
// ---------------------------------------------------------------------------

/** @type {import('../shared/scriptureEngine').VerseEntry[]} */
let _allEntries = [];

/**
 * Renders the catalog grouped by category, optionally filtered.
 *
 * @param {string} [selectedCategory]
 */
function renderCatalog(selectedCategory = '') {
  const container = document.getElementById('catalog-groups');
  if (!container) return;

  const entries = selectedCategory
    ? filterByCategory(_allEntries, selectedCategory)
    : _allEntries;

  const grouped = groupByCategory(entries);
  container.innerHTML = '';

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = '<p class="catalog-empty">No verses found for this category.</p>';
    return;
  }

  for (const [category, verses] of Object.entries(grouped)) {
    const groupEl = document.createElement('div');
    groupEl.className = 'catalog-group';
    groupEl.setAttribute('aria-label', `Category: ${category}`);

    const heading = document.createElement('h2');
    heading.className = 'catalog-group__heading';
    heading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    groupEl.appendChild(heading);

    for (const verse of verses) {
      groupEl.appendChild(buildVerseCard(verse));
    }

    container.appendChild(groupEl);
  }
}

/**
 * Populates the category filter <select> with options derived from the store.
 */
function populateCatalogFilter() {
  const select = document.getElementById('catalog-category-filter');
  if (!select) return;

  const categories = [...new Set(_allEntries.map((e) => e.category))].sort();

  // Keep the "All Categories" default option
  select.querySelectorAll('option:not([value=""])').forEach((el) => el.remove());

  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    select.appendChild(opt);
  }
}

// ---------------------------------------------------------------------------
// Bookmark view
// ---------------------------------------------------------------------------

/** @type {string[]} */
let _bookmarks = [];

/**
 * Renders the bookmarks view from the current _bookmarks list.
 */
function renderBookmarksView() {
  const list      = document.getElementById('bookmarks-list');
  const emptyMsg  = document.getElementById('bookmarks-empty');
  if (!list) return;

  const bookmarked = getBookmarkedVerses(_bookmarks, _allEntries);
  list.innerHTML = '';

  if (bookmarked.length === 0) {
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }

  if (emptyMsg) emptyMsg.hidden = true;
  for (const verse of bookmarked) {
    list.appendChild(buildVerseCard(verse));
  }
}

/**
 * Toggles a bookmark for `id` and refreshes both the bookmark view and
 * any visible bookmark button state.
 *
 * @param {string} id
 */
function handleBookmarkToggle(id) {
  _bookmarks = toggleBookmark(id, _bookmarks);
  saveBookmarks(_bookmarks);
  updateBookmarkButtonStates();
  renderBookmarksView();
}

/**
 * Reflects the current _bookmarks state onto all bookmark buttons in the DOM.
 */
function updateBookmarkButtonStates() {
  document.querySelectorAll('.btn-bookmark[data-verse-id]').forEach((btn) => {
    const id = btn.dataset.verseId;
    const isBookmarked = _bookmarks.includes(id);
    btn.setAttribute('aria-pressed', isBookmarked ? 'true' : 'false');
    btn.querySelector('.btn-action__icon').textContent = isBookmarked ? '🔖' : '🔖';
    btn.setAttribute(
      'aria-label',
      isBookmarked ? 'Remove bookmark for this verse' : 'Bookmark this verse'
    );
  });
}

// ---------------------------------------------------------------------------
// Verse card builder (used by catalog and bookmarks views)
// ---------------------------------------------------------------------------

/**
 * Creates a <article> verse card element for use in catalog / bookmark views.
 *
 * @param {import('../shared/scriptureEngine').VerseEntry} verse
 * @returns {HTMLElement}
 */
function buildVerseCard(verse) {
  const card = document.createElement('article');
  card.className = 'verse-card';
  card.dataset.verseId = verse.id;

  const isBookmarked = _bookmarks.includes(verse.id);

  card.innerHTML = `
    <p class="verse-reference">${escapeHtml(verse.reference)}</p>
    <blockquote class="verse-text"><p>${escapeHtml(verse.text)}</p></blockquote>
    <span class="verse-translation">${escapeHtml(verse.translation)}</span>
    <p class="verse-reflection">${escapeHtml(verse.reflection)}</p>
    <p class="verse-prompt">${escapeHtml(verse.quietTimePrompt)}</p>
    <div class="verse-card__actions">
      <button
        class="btn-action btn-bookmark"
        type="button"
        aria-label="${isBookmarked ? 'Remove bookmark for this verse' : 'Bookmark this verse'}"
        aria-pressed="${isBookmarked}"
        data-verse-id="${escapeHtml(verse.id)}">
        <span class="btn-action__icon" aria-hidden="true">🔖</span>
        <span class="btn-action__label">${isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
      </button>
    </div>
  `;

  card.querySelector('.btn-bookmark').addEventListener('click', () => {
    handleBookmarkToggle(verse.id);
  });

  return card;
}

// ---------------------------------------------------------------------------
// Service worker update banner
// ---------------------------------------------------------------------------

function showUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) banner.hidden = false;
}

// ---------------------------------------------------------------------------
// Main initialisation
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    // Apply stored theme (inline script already applied it before paint;
    // this call syncs aria-pressed buttons and storage after JS load)
    const storedTheme = readStoredTheme();
    applyTheme(storedTheme);

    // Load bookmarks from localStorage
    _bookmarks = loadBookmarks();

    // Load verses.json
    let versesData;
    try {
      const response = await fetch('verses.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      versesData = await response.json();
    } catch (err) {
      showToast('Could not load verse data. Please refresh.');
      return;
    }

    const versesArray = Array.isArray(versesData) ? versesData : versesData.verses;
    const initErr = initEngine(versesArray);
    if (initErr) {
      showToast('Verse data error: ' + initErr.message);
      return;
    }

    _allEntries = versesArray;

    // --- Render daily view ---
    const dailyVerse = getDailyVerse();
    if (dailyVerse && !dailyVerse.error) {
      renderDailyCard(dailyVerse);
      updateBookmarkButtonStates();

      // Translation selector + current verse state — declared first so all
      // button handlers below can close over them.
      const transSelect = document.getElementById('daily-translation-select');
      let _currentDailyVerse = dailyVerse;

      // Copy button on daily card
      const copyBtn = document.getElementById('btn-copy-daily');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const translation = transSelect ? transSelect.value : 'NIV';
          navigator.clipboard.writeText(`${_currentDailyVerse.reference} — ${getVerseText(_currentDailyVerse, translation)}`).then(() => {
            const confirm = copyBtn.querySelector('.btn-action__confirm');
            if (confirm) {
              confirm.style.visibility = 'visible';
              setTimeout(() => { confirm.style.visibility = ''; }, 1500);
            }
          });
        });
      }

      // Bookmark toggle on daily card
      const bkmBtn = document.getElementById('btn-bookmark-daily');
      if (bkmBtn) {
        bkmBtn.addEventListener('click', () => {
          handleBookmarkToggle(_currentDailyVerse.id);
        });
      }

      // Random verse button on daily card
      const randomBtn = document.getElementById('btn-random-daily');
      if (randomBtn) {
        randomBtn.addEventListener('click', () => {
          const rand = getRandomVerse();
          if (rand && !rand.error) {
            _currentDailyVerse = rand;
            renderDailyCard(_currentDailyVerse, transSelect ? transSelect.value : 'NIV');
          }
        });
      }

      // Translation selector — re-render current verse in chosen translation
      if (transSelect) {
        transSelect.addEventListener('change', () => {
          renderDailyCard(_currentDailyVerse, transSelect.value);
        });
      }
    } else {
      showToast('Could not load today\'s verse.');
    }

    // --- Populate catalog filter ---
    populateCatalogFilter();

    // --- Catalog filter change handler ---
    const filterSelect = document.getElementById('catalog-category-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        renderCatalog(filterSelect.value);
      });
    }

    // --- Initial catalog render (shown when catalog view is activated) ---
    // Lazy render: render when the user navigates to catalog
    // (avoids building the full catalog DOM on first load)

    // --- Render bookmarks view initially ---
    renderBookmarksView();

    // --- Navigation (desktop, bottom, mobile menu) ---
    document.querySelectorAll('[data-view]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        switchToView(view);
        if (view === 'catalog') {
          const sel = document.getElementById('catalog-category-filter');
          renderCatalog(sel ? sel.value : '');
        }
      });
    });

    // --- Hamburger menu ---
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger) hamburger.addEventListener('click', openMobileMenu);

    const overlay = document.getElementById('mobile-menu-overlay');
    if (overlay) overlay.addEventListener('click', closeMobileMenu);

    // --- Theme toggles (desktop sidebar + mobile header) ---
    document.querySelectorAll('.btn-theme-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme;
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });

    // --- Service worker update detection ---
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          showUpdateBanner();
        }
      });

      const refreshBtn = document.getElementById('btn-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }
  });
}

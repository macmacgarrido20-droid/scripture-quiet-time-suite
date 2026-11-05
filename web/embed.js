/**
 * embed.js
 * Embeddable Scripture Widget — self-contained, zero external network calls.
 *
 * Reads query params: ?theme=light|dark  ?category=<value>  ?mode=daily|random
 * Defaults: theme=light, category=(none), mode=daily
 *
 * Requirements: 7.1–7.10
 */

import {
  initEngine,
  getDailyVerse,
  getRandomVerse,
} from '../shared/scriptureEngine.js';

// ---------------------------------------------------------------------------
// Pure render helper — exported so property tests can call it without a DOM
// ---------------------------------------------------------------------------

/**
 * Builds the HTML string for a verse card from a VerseEntry.
 * Also updates the live DOM element when `rootEl` is provided.
 *
 * @param {import('../shared/scriptureEngine').VerseEntry} entry
 * @param {HTMLElement | null} [rootEl]
 * @returns {string} HTML string containing all rendered fields
 */
export function renderWidgetCard(entry, rootEl) {
  const referenceHtml  = `<p class="verse-reference">${escapeHtml(entry.reference)}</p>`;
  const textHtml       = `<blockquote class="verse-text">${escapeHtml(entry.text)}</blockquote>`;
  const translationHtml = `<p class="verse-translation">${escapeHtml(entry.translation)}</p>`;
  const reflectionHtml  = `<p class="verse-reflection">${escapeHtml(entry.reflection)}</p>`;
  const promptHtml      = `<p class="verse-quiet-time-prompt">${escapeHtml(entry.quietTimePrompt)}</p>`;

  const html = referenceHtml + textHtml + translationHtml + reflectionHtml + promptHtml;

  if (rootEl) {
    rootEl.classList.remove('verse-card--loading');
    rootEl.innerHTML = html;
  }

  return html;
}

/**
 * Renders an error state into the root element.
 *
 * @param {HTMLElement | null} rootEl
 * @param {string} [message]
 */
export function renderWidgetError(rootEl, message = 'Scripture unavailable') {
  if (rootEl) {
    rootEl.classList.remove('verse-card--loading');
    rootEl.innerHTML = `<p class="verse-error">${escapeHtml(message)}</p>`;
  }
}

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
// Initialisation (browser only)
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const params   = new URLSearchParams(window.location.search);
    const category = params.get('category') || '';
    const mode     = params.get('mode') || 'daily';

    const rootEl = document.getElementById('verse-card');

    // Load verses.json — same-origin relative path, no external calls
    let versesData;
    try {
      const response = await fetch('../shared/verses.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      versesData = await response.json();
    } catch (err) {
      renderWidgetError(rootEl, 'Scripture unavailable');
      return;
    }

    const versesArray = Array.isArray(versesData) ? versesData : versesData.verses;
    const initErr = initEngine(versesArray);
    if (initErr) {
      renderWidgetError(rootEl, 'Scripture unavailable');
      return;
    }

    // Retrieve the appropriate verse
    let verse;
    if (mode === 'random') {
      verse = getRandomVerse(category || undefined);
    } else {
      verse = getDailyVerse();
    }

    if (!verse || verse.error) {
      renderWidgetError(rootEl, 'Scripture unavailable');
      return;
    }

    renderWidgetCard(verse, rootEl);
  });
}

/**
 * popup.js
 * Chrome Extension popup script for the Scripture & Quiet-Time Suite.
 *
 * Responsibilities:
 * - Load today's daily verse and render reference, text, quietTimePrompt
 * - Run a 120-second focus timer with a 1-second tick via setInterval
 * - Display completion message at 0s (no navigation)
 * - "Reset" button: restart timer from 120s
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { initEngine, getDailyVerse, getRandomVerse } from './scriptureEngine.js';

// ---------------------------------------------------------------------------
// Pure render helper — exported for property test P7 (popup surface)
// ---------------------------------------------------------------------------

/**
 * Builds an HTML string representing the popup verse card.
 * Also updates the live DOM when running in a browser context.
 *
 * @param {import('../shared/scriptureEngine').VerseEntry} verse
 * @returns {string} HTML string containing reference, text, and quietTimePrompt
 */
export function renderVerseCard(verse) {
  // Support both old `text` field and new `translations` object
  const verseText = verse.translations ? (verse.translations.NIV || verse.translations.ESV || verse.text || '') : (verse.text || '');

  const referenceHtml    = `<p class="verse-reference">${escapeHtml(verse.reference)}</p>`;
  const textHtml         = `<blockquote class="verse-text">${escapeHtml(verseText)}</blockquote>`;
  const quietTimeHtml    = `<p class="quiet-time-text">${escapeHtml(verse.quietTimePrompt)}</p>`;

  const html = referenceHtml + textHtml + quietTimeHtml;

  if (typeof document !== 'undefined') {
    const refEl        = document.getElementById('verse-reference');
    const textEl       = document.getElementById('verse-text');
    const promptEl     = document.getElementById('quiet-time-text');
    const loadingEl    = document.getElementById('verse-loading');
    const errorEl      = document.getElementById('verse-error');
    const contentEl    = document.getElementById('verse-content');

    if (refEl)      refEl.textContent    = verse.reference;
    if (textEl)     textEl.textContent   = verseText;
    if (promptEl)   promptEl.textContent = verse.quietTimePrompt;
    if (loadingEl)  loadingEl.hidden  = true;
    if (errorEl)    errorEl.hidden    = true;
    if (contentEl)  contentEl.hidden  = false;
  }

  return html;
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
// Data initialisation — load verses.json relative to the extension root
// ---------------------------------------------------------------------------

async function loadEngine() {
  try {
    const response = await fetch(
      (typeof chrome !== 'undefined' && chrome.runtime)
        ? chrome.runtime.getURL('verses.json')
        : 'verses.json'
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const versesArray = Array.isArray(data) ? data : data.verses;
    return initEngine(versesArray);
  } catch (err) {
    return { error: true, message: `Failed to load verses: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// Focus timer
// ---------------------------------------------------------------------------

const TIMER_START = 120;

let remaining  = TIMER_START;
let intervalId = null;

function updateTimerDisplay() {
  const timerCount = document.getElementById('timer-count');
  if (timerCount) timerCount.textContent = remaining;
}

function clearTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function showCompletion() {
  const timerDisplay  = document.getElementById('timer-display');
  const timerComplete = document.getElementById('timer-complete');
  if (timerDisplay)  timerDisplay.hidden  = true;
  if (timerComplete) timerComplete.hidden = false;
}

function startTimer() {
  clearTimer();
  const timerDisplay  = document.getElementById('timer-display');
  const timerComplete = document.getElementById('timer-complete');
  if (timerDisplay)  timerDisplay.hidden  = false;
  if (timerComplete) timerComplete.hidden = true;
  updateTimerDisplay();

  intervalId = setInterval(() => {
    remaining -= 1;
    updateTimerDisplay();
    if (remaining <= 0) {
      clearTimer();
      showCompletion();
    }
  }, 1000);
}

function resetTimer() {
  clearTimer();
  remaining = TIMER_START;
  const timerDisplay  = document.getElementById('timer-display');
  const timerComplete = document.getElementById('timer-complete');
  if (timerDisplay)  timerDisplay.hidden  = false;
  if (timerComplete) timerComplete.hidden = true;
  updateTimerDisplay();
  startTimer();
}

// ---------------------------------------------------------------------------
// Error display helper
// ---------------------------------------------------------------------------

function showError(message) {
  const verseLoading  = document.getElementById('verse-loading');
  const verseContent  = document.getElementById('verse-content');
  const verseError    = document.getElementById('verse-error');
  const errorMessage  = document.getElementById('error-message');

  if (verseLoading) verseLoading.hidden = true;
  if (verseContent) verseContent.hidden = true;
  if (errorMessage) errorMessage.textContent = message;
  if (verseError)   verseError.hidden = false;
}

// ---------------------------------------------------------------------------
// Initialisation on DOMContentLoaded (browser only)
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', resetTimer);

    // Load verse data and render
    const loadResult = await loadEngine();
    if (loadResult && loadResult.error) {
      showError(loadResult.message);
    } else {
      const verse = getDailyVerse();
      if (verse && verse.error) {
        showError(verse.message);
      } else {
        renderVerseCard(verse);
      }
    }

    // Wire random verse button — only works after engine is loaded
    const btnRandom = document.getElementById('btn-random-popup');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => {
        const rand = getRandomVerse();
        if (rand && !rand.error) {
          renderVerseCard(rand);
        }
      });
    }

    // Start the focus timer immediately
    startTimer();
  });
}

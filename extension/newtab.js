/**
 * newtab.js  — Chrome Extension New Tab (MV3)
 * Loads verses.json via fetch, renders daily verse,
 * wires Copy / Random / Theme / Translation buttons.
 */

import { initEngine, getDailyVerse, getRandomVerse, getVerseText } from './scriptureEngine.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _currentTranslation = 'NIV'; // NIV | ESV | MBB
let _currentVerse = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function formatClipboardText(reference, text) {
  return `${reference} — ${text}`;
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀' : '🌙';
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ sqts_theme: theme });
  }
}

// ---------------------------------------------------------------------------
// Translation switcher
// ---------------------------------------------------------------------------

const TRANSLATION_LABELS = {
  NIV: 'NIV',
  ESV: 'ESV',
  MBB: 'MBB (Tagalog)'
};

function applyTranslation(trans) {
  _currentTranslation = trans;

  // Update button active states
  document.querySelectorAll('.trans-btn').forEach(btn => {
    btn.classList.toggle('trans-btn--active', btn.dataset.trans === trans);
  });

  // Update displayed text if a verse is loaded
  if (_currentVerse) {
    const textEl  = document.getElementById('verse-text');
    const transEl = document.getElementById('verse-translation');
    if (textEl)  textEl.textContent  = getVerseText(_currentVerse, trans);
    if (transEl) transEl.textContent = TRANSLATION_LABELS[trans] || trans;
  }

  // Persist
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ sqts_translation: trans });
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderVerseCard(entry) {
  const refEl   = document.getElementById('verse-reference');
  const textEl  = document.getElementById('verse-text');
  const transEl = document.getElementById('verse-translation');
  const promptEl= document.getElementById('quiet-time-text');
  const cardEl  = document.getElementById('verse-card');
  const loadEl  = document.getElementById('verse-loading');
  const contEl  = document.getElementById('verse-content');
  const badge   = document.getElementById('verse-category');

  if (refEl)    refEl.textContent    = entry.reference;
  if (textEl)   textEl.textContent   = getVerseText(entry, _currentTranslation);
  if (transEl)  transEl.textContent  = TRANSLATION_LABELS[_currentTranslation] || _currentTranslation;
  if (promptEl) promptEl.textContent = entry.quietTimePrompt;
  if (badge)    badge.textContent    = entry.category;

  if (loadEl) { loadEl.hidden = true; loadEl.style.display = 'none'; }
  if (contEl) { contEl.hidden = false; contEl.style.display = 'flex'; }
  if (cardEl) {
    cardEl.classList.remove('verse-card--loading');
    cardEl.style.background = '';
    cardEl.style.animation  = '';
    // apply background scene
    cardEl.ownerDocument.body.dataset.scene = entry.category || 'default';
  }

  _currentVerse = entry;
  window._currentVerse = entry;

  // return HTML for tests
  const referenceHtml   = `<p class="verse-reference" id="verse-reference">${escapeHtml(entry.reference)}</p>`;
  const textHtml        = `<blockquote class="verse-text" id="verse-text">${escapeHtml(getVerseText(entry, _currentTranslation))}</blockquote>`;
  const translationHtml = `<p class="verse-translation" id="verse-translation">${escapeHtml(TRANSLATION_LABELS[_currentTranslation] || _currentTranslation)}</p>`;
  const reflectionHtml  = `<div class="verse-reflection" id="verse-reflection">${escapeHtml(entry.reflection || '')}</div>`;
  const quietTimeHtml   = `<p class="quiet-time-text" id="quiet-time-text">${escapeHtml(entry.quietTimePrompt)}</p>`;
  return referenceHtml + textHtml + translationHtml + reflectionHtml + quietTimeHtml;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  // Restore theme + translation from storage
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['sqts_theme', 'sqts_translation'], (res) => {
      applyTheme((res && res.sqts_theme) || 'light');
      if (res && res.sqts_translation) {
        _currentTranslation = res.sqts_translation;
        document.querySelectorAll('.trans-btn').forEach(btn => {
          btn.classList.toggle('trans-btn--active', btn.dataset.trans === _currentTranslation);
        });
      }
    });
  }

  // Load verses.json
  let versesData;
  try {
    const url = chrome.runtime.getURL('verses.json');
    const res = await fetch(url);
    versesData = await res.json();
  } catch (e) {
    showError('Could not load verse data. (' + e.message + ')');
    return;
  }

  const initErr = initEngine(versesData.verses ?? versesData);
  if (initErr) { showError(initErr.message); return; }

  // Auto-focus search bar
  document.getElementById('search-input')?.focus();

  const verse = getDailyVerse();
  if (verse?.error) { showError(verse.message); return; }
  renderVerseCard(verse);

  // --- Translation buttons ---
  document.querySelectorAll('.trans-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTranslation(btn.dataset.trans));
  });

  // --- Copy ---
  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    const v = _currentVerse;
    if (!v) return;
    const text = getVerseText(v, _currentTranslation);
    try {
      await navigator.clipboard.writeText(formatClipboardText(v.reference, text));
      showCopyFeedback();
    } catch { /* denied */ }
  });

  // --- Random ---
  document.getElementById('btn-random')?.addEventListener('click', () => {
    const rand = getRandomVerse();
    if (!rand || rand.error) return;
    renderVerseCard(rand);
    const card = document.getElementById('verse-card');
    card?.classList.add('verse-card--pop');
    setTimeout(() => card?.classList.remove('verse-card--pop'), 400);
  });

  // --- Theme ---
  document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showError(msg) {
  const loadEl  = document.getElementById('verse-loading');
  const errorEl = document.getElementById('verse-error');
  const msgEl   = document.getElementById('error-message');
  if (loadEl)  loadEl.hidden  = true;
  if (errorEl) errorEl.hidden = false;
  if (msgEl)   msgEl.textContent = msg;
  console.error('[newtab]', msg);
}

function showCopyFeedback() {
  const btn   = document.getElementById('btn-copy');
  const label = btn?.querySelector('.btn-label');
  if (!label) return;
  const orig = label.textContent;
  label.textContent = 'Copied!';
  btn.classList.add('btn--copied');
  setTimeout(() => {
    label.textContent = orig;
    btn.classList.remove('btn--copied');
  }, 1800);
}

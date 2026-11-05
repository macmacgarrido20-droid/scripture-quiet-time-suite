/**
 * configurator.js
 * Widget Configurator logic for the Scripture & Quiet-Time Suite.
 *
 * Responsibilities:
 *  - Maintain config state { theme, category, mode }
 *  - Populate category <select> from verses.json
 *  - Update live preview iframe on any control change (updatePreview)
 *  - Build valid <iframe> embed code string (buildEmbedCode)
 *  - Copy embed code to clipboard with confirmation feedback
 *
 * ES module — buildEmbedCode is exported so P10 property test can import it.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import versesData from '../shared/verses.json' assert { type: 'json' };

// ---------------------------------------------------------------------------
// Config state
// ---------------------------------------------------------------------------

/** @type {{ theme: 'light' | 'dark', category: string, mode: 'daily' | 'random' }} */
const config = {
  theme: 'light',
  category: '',
  mode: 'daily',
};

// ---------------------------------------------------------------------------
// Public: buildEmbedCode
// ---------------------------------------------------------------------------

/**
 * Returns a valid <iframe> HTML string that embeds embed.html with
 * the supplied config encoded as query parameters.
 *
 * Exported so the P10 property test can import and exercise it independently.
 *
 * @param {{ theme: string, category: string, mode: string }} cfg
 * @returns {string}  A complete <iframe> HTML tag string.
 */
export function buildEmbedCode(cfg) {
  const params = new URLSearchParams({
    theme: cfg.theme,
    category: cfg.category,
    mode: cfg.mode,
  });
  const src = `embed.html?${params.toString()}`;
  return `<iframe src="${src}" width="480" height="320" frameborder="0" style="border:none;border-radius:8px;" title="Scripture Widget"></iframe>`;
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

/**
 * Rebuilds the preview iframe src from current config state.
 * Requirement 8.2 — real-time preview update on any control change.
 */
function updatePreview() {
  const iframe = document.getElementById('preview-iframe');
  if (!iframe) return;

  const params = new URLSearchParams({
    theme: config.theme,
    category: config.category,
    mode: config.mode,
  });
  iframe.src = `embed.html?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Category population
// ---------------------------------------------------------------------------

/**
 * Derives the unique sorted list of categories from verses.json and
 * populates the category <select> element.
 * Requirement 8.1 — category control sourced from verses.json.
 */
function populateCategorySelect() {
  const select = document.getElementById('control-category');
  if (!select) return;

  const categories = Array.from(
    new Set(versesData.verses.map((v) => v.category))
  ).sort();

  // "All categories" option (empty value → no category filter)
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All categories';
  select.appendChild(allOption);

  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat;
    // Capitalise first letter for display
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    select.appendChild(option);
  }

  // Reflect current config value
  select.value = config.category;
}

// ---------------------------------------------------------------------------
// Control event wiring
// ---------------------------------------------------------------------------

/**
 * Binds change listeners to the three controls.
 * Any change updates config state then calls updatePreview().
 */
function bindControls() {
  const themeSelect = document.getElementById('control-theme');
  const categorySelect = document.getElementById('control-category');
  const modeSelect = document.getElementById('control-mode');

  if (themeSelect) {
    themeSelect.value = config.theme;
    themeSelect.addEventListener('change', () => {
      config.theme = themeSelect.value;
      updatePreview();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      config.category = categorySelect.value;
      updatePreview();
    });
  }

  if (modeSelect) {
    modeSelect.value = config.mode;
    modeSelect.addEventListener('change', () => {
      config.mode = modeSelect.value;
      updatePreview();
    });
  }
}

// ---------------------------------------------------------------------------
// Copy Embed Code button
// ---------------------------------------------------------------------------

/**
 * Wires the "Copy Embed Code" button.
 * On click:
 *  1. Writes buildEmbedCode(config) to the clipboard.
 *  2. Sets data-copied="true" on the button (within 500ms per Req 8.5).
 *  3. Removes data-copied after 2 seconds.
 */
function bindCopyButton() {
  const btn = document.getElementById('btn-copy');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const embedCode = buildEmbedCode(config);

    navigator.clipboard.writeText(embedCode).then(() => {
      // Confirmation within 500ms — set attribute immediately after write resolves
      btn.dataset.copied = 'true';

      // Remove confirmation after 2 seconds
      setTimeout(() => {
        delete btn.dataset.copied;
      }, 2000);
    }).catch(() => {
      // Fallback: still show confirmation even if clipboard API failed
      btn.dataset.copied = 'true';
      setTimeout(() => {
        delete btn.dataset.copied;
      }, 2000);
    });
  });
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    populateCategorySelect();
    bindControls();
    bindCopyButton();
    // Render initial preview
    updatePreview();
  });
}

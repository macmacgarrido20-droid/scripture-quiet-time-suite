/**
 * scriptureEngine.js
 * Shared core module for the Scripture & Quiet-Time Suite.
 *
 * ES module — import from any surface (extension, widget, dashboard).
 * Error contract: public functions return { error: true, message: string } on
 * failure and never throw.
 */

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {import('./scriptureEngine').VerseEntry[]} */
let _store = [];

/** @type {{ error: true, message: string } | null} */
let _loadError = null;

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

/**
 * Returns the day-of-year (1–365) for the given Date object.
 * Uses only the local clock — no network calls.
 *
 * @param {Date} date
 * @returns {number} integer in [1, 365]
 */
function getDayOfYear(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date - startOfYear;
  const oneDay = 86_400_000; // ms per day
  const day = Math.floor(diff / oneDay);
  // Clamp to [1, 365] to handle leap-year day 366 and any floating-point edge
  return Math.min(Math.max(day, 1), 365);
}

/**
 * Finds the entry in `entries` whose `dayOfYear` equals `day`.
 * If no exact match exists, returns the entry with the smallest circular
 * distance on the 1–365 ring.
 *
 * @param {number} day        target day-of-year (1–365)
 * @param {import('./scriptureEngine').VerseEntry[]} entries
 * @returns {import('./scriptureEngine').VerseEntry}
 */
function findNearestVerse(day, entries) {
  // Exact match first
  const exact = entries.find((e) => e.dayOfYear === day);
  if (exact) return exact;

  // Circular (modular) distance on a 365-day ring
  let nearest = entries[0];
  let minDist = Infinity;

  for (const entry of entries) {
    const abs = Math.abs(entry.dayOfYear - day);
    const dist = Math.min(abs, 365 - abs);
    if (dist < minDist) {
      minDist = dist;
      nearest = entry;
    }
  }

  return nearest;
}

/**
 * Selects a uniformly random element from `arr` via Math.random().
 *
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Required fields for every VerseEntry */
const REQUIRED_FIELDS = [
  'id',
  'dayOfYear',
  'reference',
  'translations',
  'reflection',
  'quietTimePrompt',
  'category',
];

/**
 * Validates an array of raw verse objects against the schema defined in the
 * design document.  Returns null on success or an ErrorObject on failure.
 *
 * @param {unknown[]} verses
 * @returns {{ error: true, message: string } | null}
 */
function validateVerses(verses) {
  if (!Array.isArray(verses)) {
    return { error: true, message: 'Failed to parse verses.json: root "verses" value is not an array' };
  }

  if (verses.length < 15 || verses.length > 365) {
    return {
      error: true,
      message: `Failed to parse verses.json: array length ${verses.length} is outside the allowed range 15–365`,
    };
  }

  const seenIds = new Set();

  for (let i = 0; i < verses.length; i++) {
    const entry = verses[i];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (entry[field] === undefined || entry[field] === null) {
        return {
          error: true,
          message: `Invalid entry at index ${i}: missing field '${field}'`,
        };
      }
    }

    // Backward compat: support old `text` field
    if (!entry.translations && entry.text) {
      entry.translations = { NIV: entry.text, ESV: entry.text, MBB: entry.text };
    }

    // Duplicate id check
    if (seenIds.has(entry.id)) {
      return {
        error: true,
        message: `Invalid entry at index ${i}: duplicate id '${entry.id}'`,
      };
    }
    seenIds.add(entry.id);

    // dayOfYear range check
    if (
      !Number.isInteger(entry.dayOfYear) ||
      entry.dayOfYear < 1 ||
      entry.dayOfYear > 365
    ) {
      return {
        error: true,
        message: `Invalid entry at index ${i}: dayOfYear out of range`,
      };
    }

    // quietTimePrompt length check
    if (typeof entry.quietTimePrompt !== 'string' || entry.quietTimePrompt.length < 10) {
      return {
        error: true,
        message: `Invalid entry at index ${i}: missing field 'quietTimePrompt'`,
      };
    }
  }

  return null; // all good
}

// ---------------------------------------------------------------------------
// Public initialisation
// ---------------------------------------------------------------------------

/**
 * Initialises the engine with a pre-loaded verses array (e.g. from
 * `import versesData from './verses.json'`).  Call this once before using
 * any of the three public functions.
 *
 * @param {unknown[]} versesArray  The array from the top-level `verses` key
 * @returns {{ error: true, message: string } | null}  null on success
 */
export function initEngine(versesArray) {
  _store = [];
  _loadError = null;

  if (!versesArray) {
    _loadError = { error: true, message: 'Verses_Store contains no entries' };
    return _loadError;
  }

  const validationError = validateVerses(versesArray);
  if (validationError) {
    _loadError = validationError;
    return _loadError;
  }

  _store = versesArray;
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the verse whose `dayOfYear` matches today, or the nearest verse
 * when there is no exact match.
 *
 * @returns {import('./scriptureEngine').VerseEntry | { error: true, message: string }}
 */
export function getDailyVerse() {
  if (_loadError) return _loadError;
  if (_store.length === 0) return { error: true, message: 'Verses_Store contains no entries' };

  const today = new Date();
  const day = getDayOfYear(today);
  return findNearestVerse(day, _store);
}

/**
 * Returns a random verse, optionally filtered by `category`.
 *
 * @param {string} [category]
 * @returns {import('./scriptureEngine').VerseEntry | { error: true, message: string }}
 */
export function getRandomVerse(category) {
  if (_loadError) return _loadError;
  if (_store.length === 0) return { error: true, message: 'Verses_Store contains no entries' };

  if (category !== undefined) {
    const filtered = _store.filter((e) => e.category === category);
    if (filtered.length === 0) {
      return { error: true, message: `No entries for category: ${category}` };
    }
    return pickRandom(filtered);
  }

  return pickRandom(_store);
}

/**
 * Returns the `quietTimePrompt` string from today's daily verse.
 *
 * @returns {string | { error: true, message: string }}
 */
export function getQuietTimePrompt() {
  const verse = getDailyVerse();
  if (verse && verse.error) return verse;
  return verse.quietTimePrompt;
}

/**
 * Returns the verse text for the given translation key.
 * Falls back to NIV, then to the first available translation.
 *
 * @param {import('./scriptureEngine').VerseEntry} entry
 * @param {'NIV'|'ESV'|'MBB'} [translation='NIV']
 * @returns {string}
 */
export function getVerseText(entry, translation = 'NIV') {
  if (!entry || !entry.translations) {
    return entry?.text ?? '';
  }
  return entry.translations[translation]
    || entry.translations['NIV']
    || Object.values(entry.translations)[0]
    || '';
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

/**
 * Groups an array of VerseEntry objects by their `category` field.
 *
 * @param {import('./scriptureEngine').VerseEntry[]} entries
 * @returns {{ [category: string]: import('./scriptureEngine').VerseEntry[] }}
 */
export function groupByCategory(entries) {
  const result = {};
  for (const entry of entries) {
    const key = entry.category;
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = [];
    }
    result[key].push(entry);
  }
  return result;
}

/**
 * Returns only the entries whose `category` field equals the provided category.
 *
 * @param {import('./scriptureEngine').VerseEntry[]} entries
 * @param {string} category
 * @returns {import('./scriptureEngine').VerseEntry[]}
 */
export function filterByCategory(entries, category) {
  return entries.filter((e) => e.category === category);
}

// ---------------------------------------------------------------------------
// Export helpers for testing (not part of the public consumer API)
// ---------------------------------------------------------------------------
export { getDayOfYear, findNearestVerse, pickRandom };

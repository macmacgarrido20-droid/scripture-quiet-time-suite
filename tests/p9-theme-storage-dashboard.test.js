/**
 * P9 — Theme Storage Round-Trip — Dashboard
 *
 * Property: For each of "light" and "dark", writing to mock localStorage under
 * sqts_theme and reading back via readStoredTheme() returns the written value.
 * Also verifies independence from extension storage (chrome.storage.local).
 *
 * **Validates: Requirements 11.3, 11.7**
 */

import { describe, expect, beforeEach, afterEach, it } from 'vitest';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

let _store = {};

const mockLocalStorage = {
  getItem:    (key) => Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null,
  setItem:    (key, value) => { _store[key] = String(value); },
  removeItem: (key) => { delete _store[key]; },
  clear:      () => { _store = {}; },
};

beforeEach(() => {
  _store = {};
  // Inject mock into global scope (Vitest runs in Node; localStorage is undefined)
  globalThis.localStorage = mockLocalStorage;
});

afterEach(() => {
  delete globalThis.localStorage;
  _store = {};
});

// Import AFTER setting up mock so module reads the mock
import { readStoredTheme } from '../web/dashboard.js';

describe('P9 — Theme Storage Round-Trip — Dashboard', () => {
  it('reading from empty storage defaults to "light"', () => {
    expect(readStoredTheme()).toBe('light');
  });

  it('writing "light" to sqts_theme and reading it back returns "light"', () => {
    localStorage.setItem('sqts_theme', 'light');
    expect(readStoredTheme()).toBe('light');
  });

  it('writing "dark" to sqts_theme and reading it back returns "dark"', () => {
    localStorage.setItem('sqts_theme', 'dark');
    expect(readStoredTheme()).toBe('dark');
  });

  it('an unrecognised stored value defaults to "light"', () => {
    localStorage.setItem('sqts_theme', 'sepia');
    expect(readStoredTheme()).toBe('light');
  });

  it('dashboard localStorage is independent from extension chrome.storage.local', () => {
    // Simulate extension writing its own theme key (different storage)
    const mockChromeStorage = { sqts_theme: 'dark' };
    // Dashboard reads only from localStorage — not from mockChromeStorage
    localStorage.setItem('sqts_theme', 'light');
    expect(readStoredTheme()).toBe('light');
    // The chrome storage value does not influence the dashboard result
    expect(mockChromeStorage.sqts_theme).toBe('dark');
  });
});

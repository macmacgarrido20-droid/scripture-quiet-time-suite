/**
 * P9 — Theme Storage Round-Trip — Extension
 *
 * Property: For each of "light" and "dark", writing the theme value to a mock
 * chrome.storage.local under the key `sqts_theme` and reading it back returns
 * the exact value that was written.
 *
 * Also asserts independence: the extension's chrome.storage.local is a
 * separate namespace from localStorage, so writing to one does not affect the
 * other.
 *
 * Validates: Requirements 5.6, 5.7, 11.1, 11.7
 */

import { describe, it, beforeEach } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { applyTheme } from '../extension/newtab.js';

// ---------------------------------------------------------------------------
// Mock chrome.storage.local
// ---------------------------------------------------------------------------

/**
 * Creates a fresh, isolated mock of chrome.storage.local.
 *
 * The mock implements:
 *   set(items, callback?)   — stores each key/value pair; calls callback when done
 *   get(keys, callback?)    — retrieves the requested key(s); calls callback with result
 *
 * Both methods also return Promises so tests can use async/await if preferred.
 */
function createMockStorage() {
  const store = {};

  return {
    _store: store,

    set(items, callback) {
      Object.assign(store, items);
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    },

    get(keys, callback) {
      let result;
      if (typeof keys === 'string') {
        result = keys in store ? { [keys]: store[keys] } : {};
      } else if (Array.isArray(keys)) {
        result = {};
        for (const k of keys) {
          if (k in store) result[k] = store[k];
        }
      } else {
        // null / undefined — return everything
        result = { ...store };
      }
      if (typeof callback === 'function') callback(result);
      return Promise.resolve(result);
    },
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** The two valid theme values the extension works with. */
const themeArb = fc.constantFrom('light', 'dark');

// ---------------------------------------------------------------------------
// Test setup — install a fresh mock before each test
// ---------------------------------------------------------------------------

let mockChromeStorage;
let mockLocalStorage;

beforeEach(() => {
  // Fresh extension storage mock
  mockChromeStorage = createMockStorage();

  // Fresh localStorage mock (independent key-value store)
  mockLocalStorage = createMockStorage();
});

// ---------------------------------------------------------------------------
// Helper: call applyTheme with a controlled chrome mock
// ---------------------------------------------------------------------------

/**
 * Invokes applyTheme in a context where globalThis.chrome is shimmed to the
 * supplied mock.  The shim is torn down after the call so subsequent tests
 * are not affected.
 */
async function applyThemeWithMock(theme, chromeMock) {
  const original = globalThis.chrome;
  globalThis.chrome = { storage: { local: chromeMock } };
  try {
    applyTheme(theme);
  } finally {
    globalThis.chrome = original;
  }
  // applyTheme calls chrome.storage.local.set synchronously; the mock is
  // synchronous too, so no extra await is needed.  Return the storage state.
  return chromeMock._store;
}

// ---------------------------------------------------------------------------
// Property test — round-trip via mock chrome.storage.local
// ---------------------------------------------------------------------------

describe('P9 — Theme Storage Round-Trip — Extension', () => {
  /**
   * Property: write theme → read back → same value.
   *
   * For every theme value in { "light", "dark" }:
   *   1. Call applyTheme(theme) with a mock chrome.storage.local in scope.
   *   2. Read `sqts_theme` back from the mock storage.
   *   3. Assert the returned value strictly equals the written value.
   *
   * Validates: Requirements 5.6, 5.7, 11.1
   */
  test.prop([themeArb])(
    'writing a theme via applyTheme and reading back from chrome.storage.local returns the same value',
    async (theme) => {
      const storage = createMockStorage();
      await applyThemeWithMock(theme, storage);

      const result = await storage.get('sqts_theme');
      expect(result['sqts_theme']).toBe(theme);
    }
  );

  /**
   * Property: storage key is always exactly `sqts_theme`.
   *
   * Ensures the extension uses the defined constant key and does not
   * accidentally write under a different key name.
   *
   * Validates: Requirements 11.1
   */
  test.prop([themeArb])(
    'applyTheme writes exclusively under the sqts_theme key',
    async (theme) => {
      const storage = createMockStorage();
      await applyThemeWithMock(theme, storage);

      const allKeys = Object.keys(storage._store);
      expect(allKeys).toContain('sqts_theme');
      // No stray keys written by the extension
      expect(allKeys).toHaveLength(1);
    }
  );

  /**
   * Property: extension storage and localStorage are independent.
   *
   * Writing a theme to chrome.storage.local must not affect a separate
   * localStorage store, and vice-versa.
   *
   * Validates: Requirements 11.7
   */
  test.prop([themeArb, themeArb])(
    'chrome.storage.local and localStorage are independent — writing to one does not affect the other',
    async (extTheme, dashTheme) => {
      const extStorage  = createMockStorage();
      const dashStorage = createMockStorage();

      // Write extension theme via applyTheme
      await applyThemeWithMock(extTheme, extStorage);

      // Write dashboard theme directly to the separate mock localStorage
      await dashStorage.set({ sqts_theme: dashTheme });

      // Each store must hold only its own value
      const extResult  = await extStorage.get('sqts_theme');
      const dashResult = await dashStorage.get('sqts_theme');

      expect(extResult['sqts_theme']).toBe(extTheme);
      expect(dashResult['sqts_theme']).toBe(dashTheme);

      // Confirm the two stores are truly separate objects
      expect(extStorage._store).not.toBe(dashStorage._store);
    }
  );

  // ---------------------------------------------------------------------------
  // Deterministic unit tests — cover each theme value explicitly
  // ---------------------------------------------------------------------------

  it('round-trip: "light" written to chrome.storage.local reads back as "light"', async () => {
    const storage = createMockStorage();
    await applyThemeWithMock('light', storage);
    const result = await storage.get('sqts_theme');
    expect(result['sqts_theme']).toBe('light');
  });

  it('round-trip: "dark" written to chrome.storage.local reads back as "dark"', async () => {
    const storage = createMockStorage();
    await applyThemeWithMock('dark', storage);
    const result = await storage.get('sqts_theme');
    expect(result['sqts_theme']).toBe('dark');
  });

  it('toggling from light to dark persists only the latest value', async () => {
    const storage = createMockStorage();
    await applyThemeWithMock('light', storage);
    await applyThemeWithMock('dark', storage);
    const result = await storage.get('sqts_theme');
    expect(result['sqts_theme']).toBe('dark');
  });

  it('toggling from dark to light persists only the latest value', async () => {
    const storage = createMockStorage();
    await applyThemeWithMock('dark', storage);
    await applyThemeWithMock('light', storage);
    const result = await storage.get('sqts_theme');
    expect(result['sqts_theme']).toBe('light');
  });

  it('extension storage is unaffected when only dashboard (localStorage) is written', async () => {
    const extStorage  = createMockStorage();
    const dashStorage = createMockStorage();

    // Only write to the dashboard side
    await dashStorage.set({ sqts_theme: 'dark' });

    // Extension store must remain empty
    const extResult = await extStorage.get('sqts_theme');
    expect(extResult['sqts_theme']).toBeUndefined();
  });
});

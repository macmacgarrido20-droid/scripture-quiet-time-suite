/**
 * P6 — QuietTimePrompt Is Always a Substantive String
 *
 * Two sub-properties:
 *
 * 6a — Every `quietTimePrompt` in the Verses_Store has `length >= 10`.
 *      This verifies the data constraint at the store level, independent of
 *      any runtime call.
 *
 * 6b — For any arbitrary day-of-year (1–365), stubbing the system date to
 *      that day and calling `getQuietTimePrompt()` returns a string that
 *      exactly matches the `quietTimePrompt` of `getDailyVerse()` for the
 *      same stubbed date.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, beforeAll, afterEach, vi } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import {
  initEngine,
  getDailyVerse,
  getQuietTimePrompt,
  getDayOfYear,
} from '../shared/scriptureEngine.js';
import versesData from '../shared/verses.json' assert { type: 'json' };

// ---------------------------------------------------------------------------
// Setup — initialise the engine once with the real verses store
// ---------------------------------------------------------------------------

const VERSES = versesData.verses;

beforeAll(() => {
  const err = initEngine(VERSES);
  if (err) throw new Error(`Engine failed to initialise: ${err.message}`);
});

// Restore real timers after each property test run to prevent bleed-over
afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helper — build a Date whose local day-of-year equals `targetDay`
// ---------------------------------------------------------------------------

/**
 * Returns a Date object in a non-leap year (2023) whose day-of-year equals
 * `targetDay`.  Mirrors the same helper used in P3 so the stub fidelity is
 * already confirmed by that test suite.
 *
 * @param {number} targetDay  integer in [1, 365]
 * @returns {Date}
 */
function dateForDayOfYear(targetDay) {
  const jan1 = new Date(2023, 0, 1); // 0-indexed month
  return new Date(jan1.getTime() + (targetDay - 1) * 86_400_000);
}

// ---------------------------------------------------------------------------
// Arbitrary — day-of-year integers in [1, 365]
// ---------------------------------------------------------------------------

const dayOfYearArb = fc.integer({ min: 1, max: 365 });

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('P6 — quietTimePrompt is always a substantive string', () => {
  /**
   * Property 6a: Every entry in the Verses_Store has a quietTimePrompt that
   * is a non-empty string with at least 10 characters.
   *
   * This is a deterministic exhaustive check over the static store (not
   * random), but wrapping it in the test.prop framework keeps the pattern
   * consistent and lets fast-check shrink any counterexamples if the store
   * is updated to add entries.
   *
   * Validates: Requirements 4.2
   */
  test.prop([fc.constantFrom(...VERSES)])(
    'every store entry has a quietTimePrompt string of length >= 10',
    (entry) => {
      expect(typeof entry.quietTimePrompt).toBe('string');
      expect(entry.quietTimePrompt.length).toBeGreaterThanOrEqual(10);
    }
  );

  /**
   * Property 6b: For any day in [1, 365], getQuietTimePrompt() returns a
   * string that equals the quietTimePrompt of getDailyVerse() for the same
   * stubbed date.  This confirms that getQuietTimePrompt() correctly
   * delegates to getDailyVerse() and extracts the right field.
   *
   * Validates: Requirements 4.1, 4.2
   */
  test.prop([dayOfYearArb])(
    'getQuietTimePrompt() matches getDailyVerse().quietTimePrompt for the same date',
    (day) => {
      vi.useFakeTimers();
      vi.setSystemTime(dateForDayOfYear(day));

      const verse = getDailyVerse();
      const prompt = getQuietTimePrompt();

      vi.useRealTimers();

      // getDailyVerse must not be an error
      expect(verse).not.toHaveProperty('error');

      // getQuietTimePrompt must return a plain string (not an error object)
      expect(typeof prompt).toBe('string');

      // The returned prompt must exactly match the verse's quietTimePrompt
      expect(prompt).toBe(verse.quietTimePrompt);

      // And it must satisfy the length constraint independently
      expect(prompt.length).toBeGreaterThanOrEqual(10);
    }
  );
});

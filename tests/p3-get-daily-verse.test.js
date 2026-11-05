/**
 * P3 — getDailyVerse Always Returns a Valid Verse Entry
 *
 * Property: For any arbitrary day-of-year value (1–365), stubbing the system
 * date to that day and calling getDailyVerse() must:
 *   1. Return a VerseEntry (never an ErrorObject)
 *   2. Return an entry whose `id` exists in the loaded store
 *   3. Return the exact matching entry when the day matches a store entry
 *
 * Validates: Requirements 2.2, 2.3
 */

import { describe, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { initEngine, getDailyVerse, getDayOfYear } from '../shared/scriptureEngine.js';
import versesData from '../shared/verses.json' assert { type: 'json' };

// ---------------------------------------------------------------------------
// Setup — initialise the engine once with the real verses store
// ---------------------------------------------------------------------------

const VERSES = versesData.verses;

beforeAll(() => {
  const err = initEngine(VERSES);
  if (err) throw new Error(`Engine failed to initialise: ${err.message}`);
});

// Restore real timers after each test so tests don't bleed into each other
afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Date whose day-of-year (local clock) equals `targetDay`. */
function dateForDayOfYear(targetDay) {
  // Start at Jan 1 of an arbitrary non-leap year (2023)
  const jan1 = new Date(2023, 0, 1); // month is 0-indexed
  // getDayOfYear treats Jan 1 as day 1, so offset = targetDay - 1 days
  const date = new Date(jan1.getTime() + (targetDay - 1) * 86_400_000);
  return date;
}

/** Set names for the required VerseEntry fields */
const REQUIRED_FIELDS = [
  'id',
  'dayOfYear',
  'reference',
  'text',
  'translation',
  'reflection',
  'quietTimePrompt',
  'category',
];

// Build a Set of all IDs and a Map from dayOfYear → entry for fast lookup
const storeIds = new Set(VERSES.map((v) => v.id));
const dayToEntry = new Map(VERSES.map((v) => [v.dayOfYear, v]));

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates arbitrary day-of-year integers in [1, 365].
 */
const dayOfYearArb = fc.integer({ min: 1, max: 365 });

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('P3 — getDailyVerse always returns a valid VerseEntry', () => {
  /**
   * Property 3a: For any day in [1, 365], getDailyVerse returns a VerseEntry
   * (not an ErrorObject) and the returned entry exists in the store.
   *
   * Validates: Requirements 2.2, 2.3
   */
  test.prop([dayOfYearArb])(
    'returns a VerseEntry (not an ErrorObject) for any day in 1–365',
    (day) => {
      // Stub the system clock to the date corresponding to `day`
      vi.useFakeTimers();
      vi.setSystemTime(dateForDayOfYear(day));

      const result = getDailyVerse();

      vi.useRealTimers();

      // Must not be an ErrorObject
      expect(result).not.toHaveProperty('error');

      // Must have all required VerseEntry fields
      for (const field of REQUIRED_FIELDS) {
        expect(result).toHaveProperty(field);
      }

      // The returned entry's id must exist in the store
      expect(storeIds.has(result.id)).toBe(true);
    }
  );

  /**
   * Property 3b: When today's day-of-year exactly matches a store entry's
   * `dayOfYear`, getDailyVerse returns that specific entry.
   *
   * Validates: Requirements 2.2
   */
  test.prop([fc.constantFrom(...VERSES).map((v) => v.dayOfYear)])(
    'returns the exact matching entry when the day matches a store entry',
    (day) => {
      vi.useFakeTimers();
      vi.setSystemTime(dateForDayOfYear(day));

      const result = getDailyVerse();

      vi.useRealTimers();

      // The expected entry from the store
      const expected = dayToEntry.get(day);

      expect(result.id).toBe(expected.id);
      expect(result.dayOfYear).toBe(expected.dayOfYear);
      expect(result.reference).toBe(expected.reference);
    }
  );

  /**
   * Property 3c: The day-of-year computed from the stubbed date matches the
   * day we intended to stub — verifying the test helper is correct.
   *
   * Validates: Requirements 2.1 (indirectly confirms stub fidelity)
   */
  test.prop([dayOfYearArb])(
    'stubbed date produces the expected day-of-year',
    (day) => {
      const date = dateForDayOfYear(day);
      expect(getDayOfYear(date)).toBe(day);
    }
  );
});

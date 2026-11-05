/**
 * P2 — DayOfYear Always Produces a Value in 1–365
 *
 * Property: For any arbitrary Date object, getDayOfYear(date) always returns
 * an integer in the range [1, 365] inclusive.
 *
 * Validates: Requirements 2.1
 */

import { describe } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { getDayOfYear } from '../shared/scriptureEngine.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates arbitrary Date objects via arbitrary integer timestamps.
 *
 * Constrained to a practical range:
 *   min — 1970-01-01T00:00:00.000Z (Unix epoch)
 *   max — 9999-12-31T23:59:59.999Z (max safe JS Date)
 *
 * This covers leap years, year boundaries, and all 365 (or 366) days.
 */
const dateArb = fc
  .integer({ min: 0, max: 253_402_300_799_999 })
  .map((ms) => new Date(ms));

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('P2 — getDayOfYear always returns a value in 1–365', () => {
  /**
   * Property: getDayOfYear(date) ∈ [1, 365] for every possible Date.
   *
   * The implementation clamps day 366 (leap-year Dec 31) down to 365 so the
   * return value is always within the 1–365 ring used by the verse store.
   *
   * Validates: Requirements 2.1
   */
  test.prop([dateArb])(
    'getDayOfYear returns an integer in [1, 365] for any arbitrary date',
    (date) => {
      const result = getDayOfYear(date);

      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(365);
      expect(Number.isInteger(result)).toBe(true);
    }
  );
});

/**
 * P5 — getRandomVerse With Unknown Category Returns an Error Object
 *
 * Property: For any string that is NOT one of the category values present in
 * the Verses_Store, calling getRandomVerse(unknownCategory) must return an
 * object with `error === true` and a non-empty `message` string.
 *
 * Validates: Requirements 3.3
 */

import { describe, beforeAll } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { initEngine, getRandomVerse } from '../shared/scriptureEngine.js';
import versesData from '../shared/verses.json' assert { type: 'json' };

// ---------------------------------------------------------------------------
// Setup — initialise the engine once with the real verses store
// ---------------------------------------------------------------------------

const VERSES = versesData.verses;

/** The complete set of category strings that exist in the store */
const KNOWN_CATEGORIES = new Set(VERSES.map((v) => v.category));

beforeAll(() => {
  const err = initEngine(VERSES);
  if (err) throw new Error(`Engine failed to initialise: ${err.message}`);
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates arbitrary strings that are guaranteed NOT to be a category value
 * present in the Verses_Store.
 *
 * Using fc.string() filtered to exclude every known category ensures that any
 * generated value is truly unknown to the engine, exercising requirement 3.3.
 *
 * minLength: 1 so we never pass an empty string (getRandomVerse(undefined)
 * path is a different code branch entirely).
 */
const unknownCategoryArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => !KNOWN_CATEGORIES.has(s));

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('P5 — getRandomVerse with unknown category returns an error object', () => {
  /**
   * Property: When getRandomVerse is called with a category string that has no
   * matching entries in the store, the return value must be an error object
   * with `error === true` and a non-empty `message` string.
   *
   * Validates: Requirements 3.3
   */
  test.prop([unknownCategoryArb])(
    'returns { error: true, message: <non-empty string> } for any unknown category',
    (unknownCategory) => {
      const result = getRandomVerse(unknownCategory);

      // Must be an error object
      expect(result.error).toBe(true);

      // message must be a non-empty string
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  );

  /**
   * Additional check: the error message specifically mentions the unknown
   * category so callers can identify which category caused the failure.
   *
   * Validates: Requirements 3.3 (descriptive message requirement)
   */
  test.prop([unknownCategoryArb])(
    'error message includes the unknown category value',
    (unknownCategory) => {
      const result = getRandomVerse(unknownCategory);

      expect(result.message).toContain(unknownCategory);
    }
  );
});

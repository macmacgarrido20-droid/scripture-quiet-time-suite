/**
 * P4 — getRandomVerse With Category Returns Only Matching Verses
 *
 * Property: For each valid category in the store, many repeated calls to
 * getRandomVerse(category) must always return a VerseEntry whose `category`
 * matches the requested one. Without a category argument, the returned entry
 * must exist in the full store.
 *
 * Validates: Requirements 3.1, 3.2
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

beforeAll(() => {
  const err = initEngine(VERSES);
  if (err) throw new Error(`Engine failed to initialise: ${err.message}`);
});

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

/** All distinct categories that appear in the store */
const VALID_CATEGORIES = [...new Set(VERSES.map((v) => v.category))];

/** Set of all verse ids for fast membership lookup */
const storeIds = new Set(VERSES.map((v) => v.id));

/** Required fields on every VerseEntry */
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

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('P4 — getRandomVerse with category returns only matching verses', () => {
  /**
   * Property 4a: For any valid category, getRandomVerse(category) always
   * returns a VerseEntry whose `category` field equals the requested category.
   *
   * We generate an arbitrary (category, callCount) pair where callCount is
   * in [100, 150], then assert every single call returns the right category.
   * This exercises many iterations per property run.
   *
   * **Validates: Requirements 3.2**
   */
  test.prop([
    fc.constantFrom(...VALID_CATEGORIES),
    fc.integer({ min: 100, max: 150 }),
  ])(
    'returns an entry matching the requested category — for every call across 100+ iterations',
    (category, callCount) => {
      for (let i = 0; i < callCount; i++) {
        const result = getRandomVerse(category);

        // Must not be an ErrorObject
        expect(result).not.toHaveProperty('error');

        // Must have all required VerseEntry fields
        for (const field of REQUIRED_FIELDS) {
          expect(result).toHaveProperty(field);
        }

        // The category must match exactly
        expect(result.category).toBe(category);
      }
    }
  );

  /**
   * Property 4b: When called without a category argument, getRandomVerse()
   * always returns an entry that exists in the full store (identified by id).
   *
   * **Validates: Requirements 3.1**
   */
  test.prop([fc.integer({ min: 100, max: 150 })])(
    'returns an entry from the full store when called without a category',
    (callCount) => {
      for (let i = 0; i < callCount; i++) {
        const result = getRandomVerse();

        // Must not be an ErrorObject
        expect(result).not.toHaveProperty('error');

        // Must have all required VerseEntry fields
        for (const field of REQUIRED_FIELDS) {
          expect(result).toHaveProperty(field);
        }

        // The returned entry's id must exist in the full store
        expect(storeIds.has(result.id)).toBe(true);
      }
    }
  );

  /**
   * Property 4c: The result returned by getRandomVerse(category) is always
   * a member of the category-filtered subset, confirming filtering correctness.
   *
   * **Validates: Requirements 3.2**
   */
  test.prop([fc.constantFrom(...VALID_CATEGORIES)])(
    'returned entry is always a member of the category-filtered subset',
    (category) => {
      const subset = VERSES.filter((v) => v.category === category);
      const subsetIds = new Set(subset.map((v) => v.id));

      // Run enough iterations to get meaningful coverage without redundancy
      for (let i = 0; i < 100; i++) {
        const result = getRandomVerse(category);

        expect(result).not.toHaveProperty('error');

        // The id must be in the filtered subset — not just anywhere in the store
        expect(subsetIds.has(result.id)).toBe(true);
      }
    }
  );
});

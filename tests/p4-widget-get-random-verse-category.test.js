/**
 * P4 (Widget surface) — getRandomVerse With Category Returns Only Matching Verses
 *
 * Widget integration test: simulates the widget loading with an arbitrary valid
 * `category` query parameter. The widget's embed.js reads this param and calls
 * `getRandomVerse(category)`. We exercise that exact call path here and assert
 * that every returned verse entry's `category` matches the one the widget was
 * configured with.
 *
 * Since the widget is a self-contained iframe that calls `getRandomVerse(category)`
 * on DOMContentLoaded, testing at the engine level (the widget's direct dependency)
 * gives full coverage of Requirement 7.5 without a headless browser.
 *
 * **Validates: Requirements 7.5**
 */

import { describe, beforeAll } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { initEngine, getRandomVerse } from '../shared/scriptureEngine.js';
import versesData from '../shared/verses.json' assert { type: 'json' };

// ---------------------------------------------------------------------------
// Setup — initialise the engine once with the real verses store (mirrors what
// embed.js does on widget load)
// ---------------------------------------------------------------------------

const VERSES = versesData.verses;

beforeAll(() => {
  const err = initEngine(VERSES);
  if (err) throw new Error(`Engine failed to initialise: ${err.message}`);
});

// ---------------------------------------------------------------------------
// Derived constants (mirroring the widget's available input space)
// ---------------------------------------------------------------------------

/** All distinct category values present in the store — valid widget ?category= values */
const VALID_CATEGORIES = [...new Set(VERSES.map((v) => v.category))];

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

describe('P4 (widget surface) — getRandomVerse with category returns only matching verses', () => {
  /**
   * Property 4 (widget): For any valid category value that could appear in the
   * widget's ?category= query parameter, every call to getRandomVerse(category)
   * shall return a VerseEntry whose `category` field exactly matches the param.
   *
   * The generator picks an arbitrary category from the store (the set of valid
   * widget inputs) and an arbitrary call count in [100, 150] to verify the
   * property holds across many invocations per run.
   *
   * **Validates: Requirements 7.5**
   */
  test.prop([
    fc.constantFrom(...VALID_CATEGORIES),
    fc.integer({ min: 100, max: 150 }),
  ])(
    'widget ?category param: every getRandomVerse(category) call returns a matching entry',
    (category, callCount) => {
      // Build the category-specific subset as the widget's expected output space
      const categorySubset = VERSES.filter((v) => v.category === category);
      const subsetIds = new Set(categorySubset.map((v) => v.id));

      for (let i = 0; i < callCount; i++) {
        // This mirrors embed.js: getRandomVerse(category) called with the ?category param
        const result = getRandomVerse(category);

        // Widget must never render an error card — result must be a VerseEntry
        expect(result).not.toHaveProperty('error');

        // All required fields must be present (widget renders reference, text, etc.)
        for (const field of REQUIRED_FIELDS) {
          expect(result).toHaveProperty(field);
        }

        // Core assertion for Req 7.5: the displayed verse's category must match
        // the ?category= query parameter the widget was loaded with
        expect(result.category).toBe(category);

        // Additionally, the verse must come from the filtered subset — not the full store
        expect(subsetIds.has(result.id)).toBe(true);
      }
    }
  );

  /**
   * Property 4b (widget — no category param): When the widget is loaded without
   * a ?category= parameter, getRandomVerse() is called with no argument.
   * Every such call must return a VerseEntry that exists in the full store.
   *
   * This validates the widget's default (unconstrained) mode alongside the
   * category-filtered mode, ensuring both paths are correct.
   *
   * **Validates: Requirements 7.5**
   */
  test.prop([fc.integer({ min: 100, max: 150 })])(
    'widget with no ?category param: getRandomVerse() always returns a verse from the full store',
    (callCount) => {
      const allIds = new Set(VERSES.map((v) => v.id));

      for (let i = 0; i < callCount; i++) {
        // Mirrors embed.js when no category param is present
        const result = getRandomVerse();

        // Must be a valid VerseEntry, not an error
        expect(result).not.toHaveProperty('error');

        // All required fields present
        for (const field of REQUIRED_FIELDS) {
          expect(result).toHaveProperty(field);
        }

        // Must be from the full store
        expect(allIds.has(result.id)).toBe(true);
      }
    }
  );

  /**
   * Property 4c (widget — category isolation): For any two distinct categories
   * present in the store, verses returned for one category are never from the
   * other category's subset. Verifies there is no cross-contamination between
   * category-filtered widget instances.
   *
   * **Validates: Requirements 7.5**
   */
  test.prop([
    fc.constantFrom(...VALID_CATEGORIES),
    fc.constantFrom(...VALID_CATEGORIES),
  ])(
    'widget category isolation: verses for one category never appear in another category subset',
    (categoryA, categoryB) => {
      // Only meaningful when the two categories differ
      fc.pre(categoryA !== categoryB);

      const subsetB = new Set(
        VERSES.filter((v) => v.category === categoryB).map((v) => v.id)
      );

      // Run multiple iterations to get coverage across the category-A subset
      for (let i = 0; i < 50; i++) {
        const result = getRandomVerse(categoryA);

        expect(result).not.toHaveProperty('error');

        // A verse returned for categoryA must not belong to categoryB's subset
        expect(result.category).not.toBe(categoryB);
        expect(subsetB.has(result.id)).toBe(false);
      }
    }
  );
});

/**
 * P11 — Category Grouping and Filtering Correctness
 *
 * Property 11a: For any array of VerseEntry objects, groupByCategory(entries)
 * returns an object where every entry stored under key K has category === K,
 * and no entry appears under a key that doesn't match its category.
 *
 * Property 11b: For any array of VerseEntry objects and any category string,
 * filterByCategory(entries, category) returns exactly the entries whose
 * category matches — no missing entries, no extra entries.
 *
 * **Validates: Requirements 7.5, 9.2, 9.3**
 */

import { describe } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { groupByCategory, filterByCategory } from '../shared/scriptureEngine.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Categories drawn from a small fixed set so grouping is testable */
const categoryArb = fc.constantFrom('hope', 'peace', 'faith', 'gratitude');

/**
 * Generates an arbitrary VerseEntry-shaped record.
 * Only `category` and `id` are semantically significant for P11; the other
 * fields are present to satisfy the VerseEntry shape.
 */
const verseEntryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  dayOfYear: fc.integer({ min: 1, max: 365 }),
  reference: fc.string({ minLength: 1, maxLength: 50 }),
  text: fc.string({ minLength: 1, maxLength: 200 }),
  translation: fc.string({ minLength: 1, maxLength: 10 }),
  reflection: fc.string({ minLength: 1, maxLength: 200 }),
  quietTimePrompt: fc.string({ minLength: 10, maxLength: 200 }),
  category: categoryArb,
});

/** Arbitrary array of VerseEntry objects (0–50 entries) */
const verseArrayArb = fc.array(verseEntryArb, { minLength: 0, maxLength: 50 });

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('P11 — Category Grouping and Filtering Correctness', () => {
  /**
   * Property 11a-i: Every entry stored under a given key in groupByCategory's
   * output has a `category` field equal to that key.
   *
   * **Validates: Requirements 9.2**
   */
  test.prop([verseArrayArb])(
    'groupByCategory: every entry under key K has category === K (no mismatches)',
    (entries) => {
      const grouped = groupByCategory(entries);

      for (const [key, group] of Object.entries(grouped)) {
        for (const entry of group) {
          expect(entry.category).toBe(key);
        }
      }
    }
  );

  /**
   * Property 11a-ii: Every entry in the input appears under exactly one key
   * (its own category) — no entry is missing or double-counted.
   *
   * **Validates: Requirements 9.2**
   */
  test.prop([verseArrayArb])(
    'groupByCategory: all entries appear in the output, each under its own category key',
    (entries) => {
      const grouped = groupByCategory(entries);

      // Flatten grouped values back to a single array and compare length
      const flatGrouped = Object.values(grouped).flat();
      expect(flatGrouped.length).toBe(entries.length);

      // Every input entry exists under its category key
      for (const entry of entries) {
        const group = grouped[entry.category];
        expect(group).toBeDefined();
        expect(group).toContainEqual(entry);
      }
    }
  );

  /**
   * Property 11a-iii: groupByCategory produces no keys that don't correspond
   * to actual categories present in the input.
   *
   * **Validates: Requirements 9.2**
   */
  test.prop([verseArrayArb])(
    'groupByCategory: output keys are exactly the set of categories present in the input',
    (entries) => {
      const grouped = groupByCategory(entries);
      const inputCategories = new Set(entries.map((e) => e.category));
      const outputKeys = new Set(Object.keys(grouped));

      expect(outputKeys).toEqual(inputCategories);
    }
  );

  /**
   * Property 11b-i: filterByCategory returns only entries whose category
   * matches — no extra entries sneak through.
   *
   * **Validates: Requirements 7.5, 9.3**
   */
  test.prop([verseArrayArb, categoryArb])(
    'filterByCategory: every returned entry has category === the requested category (no extras)',
    (entries, category) => {
      const result = filterByCategory(entries, category);

      for (const entry of result) {
        expect(entry.category).toBe(category);
      }
    }
  );

  /**
   * Property 11b-ii: filterByCategory returns all matching entries — none
   * are omitted from the result.
   *
   * **Validates: Requirements 7.5, 9.3**
   */
  test.prop([verseArrayArb, categoryArb])(
    'filterByCategory: every matching entry from the source array appears in the result (no missing)',
    (entries, category) => {
      const result = filterByCategory(entries, category);
      const expected = entries.filter((e) => e.category === category);

      expect(result.length).toBe(expected.length);

      for (const entry of expected) {
        expect(result).toContainEqual(entry);
      }
    }
  );

  /**
   * Property 11b-iii: The result of filterByCategory is a subset of the
   * input array — it never introduces entries not present in the source.
   *
   * **Validates: Requirements 7.5, 9.3**
   */
  test.prop([verseArrayArb, categoryArb])(
    'filterByCategory: result is always a subset of the input entries',
    (entries, category) => {
      const result = filterByCategory(entries, category);

      for (const entry of result) {
        expect(entries).toContainEqual(entry);
      }
    }
  );
});

/**
 * P15 — getBookmarkedVerses Returns Exactly the Bookmarked Entries
 *
 * Property: getBookmarkedVerses(ids, allEntries) returns exactly the entries
 * whose id is in ids — no more, no fewer — regardless of extra ids or entries.
 *
 * **Validates: Requirements 12.3**
 */

import { describe, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { getBookmarkedVerses } from '../web/dashboard.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb = fc.constantFrom('hope', 'peace', 'faith', 'gratitude');

const verseEntryArb = fc.record({
  id:             fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  dayOfYear:      fc.integer({ min: 1, max: 365 }),
  reference:      fc.string({ minLength: 1, maxLength: 50 }),
  text:           fc.string({ minLength: 1, maxLength: 200 }),
  translation:    fc.string({ minLength: 1, maxLength: 10 }),
  reflection:     fc.string({ minLength: 0, maxLength: 200 }),
  quietTimePrompt: fc.string({ minLength: 10, maxLength: 200 }),
  category:       categoryArb,
});

const verseArrayArb = fc.uniqueArray(verseEntryArb, {
  selector: (e) => e.id,
  minLength: 0,
  maxLength: 30,
});

describe('P15 — getBookmarkedVerses returns exactly the bookmarked entries', () => {
  test.prop([verseArrayArb, fc.array(fc.string({ minLength: 1, maxLength: 20 }))])(
    'result contains only entries whose id is in the ids list',
    (allEntries, ids) => {
      const result = getBookmarkedVerses(ids, allEntries);
      const idSet  = new Set(ids);

      for (const entry of result) {
        expect(idSet.has(entry.id)).toBe(true);
      }
    }
  );

  test.prop([verseArrayArb, fc.array(fc.string({ minLength: 1, maxLength: 20 }))])(
    'result contains every entry from allEntries whose id is in the ids list',
    (allEntries, ids) => {
      const result   = getBookmarkedVerses(ids, allEntries);
      const idSet    = new Set(ids);
      const expected = allEntries.filter((e) => idSet.has(e.id));

      expect(result.length).toBe(expected.length);
      for (const entry of expected) {
        expect(result).toContainEqual(entry);
      }
    }
  );

  test.prop([verseArrayArb])(
    'passing an empty ids list always returns an empty result',
    (allEntries) => {
      const result = getBookmarkedVerses([], allEntries);
      expect(result).toHaveLength(0);
    }
  );
});

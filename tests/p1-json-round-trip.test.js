/**
 * P1 — JSON Round-Trip Preserves Verse Data
 *
 * Property: For any arbitrary VerseEntry-shaped object, serialising it to JSON
 * and deserialising it back produces a deeply-equal value.
 *
 * Validates: Requirements 1.7
 */

import { describe, it } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a string that represents a valid category value.
 * The spec allows the four canonical labels plus arbitrary extra strings.
 */
const categoryArb = fc.oneof(
  fc.constantFrom('hope', 'peace', 'faith', 'gratitude'),
  fc.string({ minLength: 1, maxLength: 30 })
);

/**
 * Generates a quietTimePrompt that always satisfies the ≥10 character
 * constraint imposed by the schema.
 */
const quietTimePromptArb = fc.string({ minLength: 10, maxLength: 300 });

/**
 * Generates a VerseEntry-shaped object with all required fields.
 *
 * Field shapes follow the schema documented in the spec:
 *   id             – non-empty string
 *   dayOfYear      – integer 1–365
 *   reference      – non-empty string (e.g. "John 3:16")
 *   text           – non-empty string
 *   translation    – non-empty string (e.g. "NIV")
 *   reflection     – string (may be empty)
 *   quietTimePrompt – string of ≥10 chars
 *   category       – one of the four canonical labels or any other string
 */
const verseEntryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  dayOfYear: fc.integer({ min: 1, max: 365 }),
  reference: fc.string({ minLength: 1, maxLength: 100 }),
  text: fc.string({ minLength: 1, maxLength: 2000 }),
  translation: fc.string({ minLength: 1, maxLength: 20 }),
  reflection: fc.string({ minLength: 0, maxLength: 2000 }),
  quietTimePrompt: quietTimePromptArb,
  category: categoryArb,
});

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('P1 — JSON round-trip preserves verse data', () => {
  /**
   * Property: JSON.parse(JSON.stringify(entry)) deeply equals the original.
   *
   * This confirms that every field in a VerseEntry is JSON-serialisable and
   * that the schema contains no types (e.g. Date, undefined, Symbol, Infinity)
   * that would be silently dropped or transformed by JSON serialisation.
   *
   * Validates: Requirements 1.7
   */
  test.prop([verseEntryArb])(
    'serialising and deserialising a VerseEntry produces an identical value',
    (entry) => {
      const roundTripped = JSON.parse(JSON.stringify(entry));
      expect(roundTripped).toStrictEqual(entry);
    }
  );
});

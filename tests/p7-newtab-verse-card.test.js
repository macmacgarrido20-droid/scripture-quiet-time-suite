/**
 * P7 — Verse Card Rendering Preserves All Required Fields — New Tab
 *
 * Property: For any arbitrary VerseEntry object, calling the newtab
 * `renderVerseCard()` function returns an HTML string that contains the
 * `reference`, `text`, `translation`, `reflection`, and `quietTimePrompt`
 * values as visible (escaped) content.
 *
 * The render function already exports a pure HTML-string path that does NOT
 * require a real DOM — it builds the markup from the entry and returns it.
 * The DOM-update branch is skipped when `document` is undefined, which is
 * the case in the Vitest (Node) environment.
 *
 * **Validates: Requirements 5.1**
 */

import { describe } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { renderVerseCard } from '../extension/newtab.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a string that represents a valid category value.
 */
const categoryArb = fc.oneof(
  fc.constantFrom('hope', 'peace', 'faith', 'gratitude'),
  fc.string({ minLength: 1, maxLength: 30 })
);

/**
 * Generates a quietTimePrompt that satisfies the ≥10 character constraint.
 */
const quietTimePromptArb = fc.string({ minLength: 10, maxLength: 300 });

/**
 * Generates a VerseEntry-shaped object with all required fields.
 * String fields use printable ASCII characters (no HTML control chars) to
 * keep expected-value matching straightforward — the render function escapes
 * HTML special chars, and we verify the escaped forms appear in the output.
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
// HTML escape helper (mirrors the one inside newtab.js)
// ---------------------------------------------------------------------------

/**
 * Escapes special HTML characters so we can compare the expected escaped
 * value against what renderVerseCard() places in the returned HTML string.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('P7 — verse card rendering preserves all required fields (new tab)', () => {
  /**
   * Property 7: renderVerseCard(entry) returns an HTML string that contains
   * the HTML-escaped forms of all five required VerseEntry display fields:
   *   - reference
   *   - text
   *   - translation
   *   - reflection
   *   - quietTimePrompt
   *
   * Validates: Requirements 5.1
   */
  test.prop([verseEntryArb])(
    'rendered HTML contains the escaped reference, text, translation, reflection, and quietTimePrompt',
    (entry) => {
      const html = renderVerseCard(entry);

      // The return value must be a non-empty string
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);

      // Each required field's escaped content must appear somewhere in the output
      expect(html).toContain(escapeHtml(entry.reference));
      expect(html).toContain(escapeHtml(entry.text));
      expect(html).toContain(escapeHtml(entry.translation));
      expect(html).toContain(escapeHtml(entry.reflection));
      expect(html).toContain(escapeHtml(entry.quietTimePrompt));
    }
  );

  /**
   * Structural check: the rendered HTML uses the correct element IDs that
   * the newtab page relies on for progressive enhancement (the DOM-update
   * path targets these same IDs when running in a real browser).
   *
   * Validates: Requirements 5.1
   */
  test.prop([verseEntryArb])(
    'rendered HTML contains the structural element IDs expected by newtab.html',
    (entry) => {
      const html = renderVerseCard(entry);

      expect(html).toContain('id="verse-reference"');
      expect(html).toContain('id="verse-text"');
      expect(html).toContain('id="verse-translation"');
      expect(html).toContain('id="verse-reflection"');
      expect(html).toContain('id="quiet-time-text"');
    }
  );
});

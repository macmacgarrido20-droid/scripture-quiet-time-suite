/**
 * P7 — Verse Card Rendering Preserves All Required Fields — Popup
 *
 * Property: For any arbitrary VerseEntry object, calling the popup
 * `renderVerseCard()` function returns an HTML string that contains the
 * `reference`, `text`, and `quietTimePrompt` values as visible (escaped)
 * content.
 *
 * The popup render function exports a pure HTML-string path that does NOT
 * require a real DOM — the DOM-update branch is skipped when `document` is
 * undefined, which is the case in the Vitest (Node) environment.
 *
 * **Validates: Requirements 6.1**
 */

import { describe, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { renderVerseCard } from '../extension/popup.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb = fc.oneof(
  fc.constantFrom('hope', 'peace', 'faith', 'gratitude'),
  fc.string({ minLength: 1, maxLength: 30 })
);

const quietTimePromptArb = fc.string({ minLength: 10, maxLength: 300 });

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
// HTML escape helper (mirrors the one inside popup.js)
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('P7 — verse card rendering preserves all required fields (popup)', () => {
  /**
   * Property 7 (popup): renderVerseCard(entry) returns an HTML string that
   * contains the HTML-escaped forms of all three required popup display fields:
   *   - reference
   *   - text
   *   - quietTimePrompt
   *
   * Validates: Requirements 6.1
   */
  test.prop([verseEntryArb])(
    'rendered HTML contains the escaped reference, text, and quietTimePrompt',
    (entry) => {
      const html = renderVerseCard(entry);

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);

      expect(html).toContain(escapeHtml(entry.reference));
      expect(html).toContain(escapeHtml(entry.text));
      expect(html).toContain(escapeHtml(entry.quietTimePrompt));
    }
  );
});

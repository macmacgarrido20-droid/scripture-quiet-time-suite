/**
 * P7 — Verse Card Rendering Preserves All Required Fields — Dashboard
 *
 * Property: For any arbitrary VerseEntry, renderDailyCard() returns an HTML
 * string containing the reference, text, translation, reflection, and
 * quietTimePrompt values as visible (escaped) content.
 *
 * **Validates: Requirements 9.1**
 */

import { describe, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { renderDailyCard } from '../web/dashboard.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb       = fc.constantFrom('hope', 'peace', 'faith', 'gratitude');
const quietTimePromptArb = fc.string({ minLength: 10, maxLength: 300 });

const verseEntryArb = fc.record({
  id:             fc.string({ minLength: 1, maxLength: 50 }),
  dayOfYear:      fc.integer({ min: 1, max: 365 }),
  reference:      fc.string({ minLength: 1, maxLength: 100 }),
  text:           fc.string({ minLength: 1, maxLength: 2000 }),
  translation:    fc.string({ minLength: 1, maxLength: 20 }),
  reflection:     fc.string({ minLength: 0, maxLength: 2000 }),
  quietTimePrompt: quietTimePromptArb,
  category:       categoryArb,
});

// ---------------------------------------------------------------------------
// HTML escape helper (mirrors dashboard.js)
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

describe('P7 — verse card rendering preserves all required fields (dashboard)', () => {
  test.prop([verseEntryArb])(
    'rendered HTML contains the escaped reference, text, translation, reflection, and quietTimePrompt',
    (entry) => {
      const html = renderDailyCard(entry);

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);

      expect(html).toContain(escapeHtml(entry.reference));
      expect(html).toContain(escapeHtml(entry.text));
      expect(html).toContain(escapeHtml(entry.translation));
      expect(html).toContain(escapeHtml(entry.reflection));
      expect(html).toContain(escapeHtml(entry.quietTimePrompt));
    }
  );
});

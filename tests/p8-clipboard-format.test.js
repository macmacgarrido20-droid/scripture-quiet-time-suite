/**
 * P8 — Clipboard Format Contains Reference and Text
 *
 * **Validates: Requirements 5.4**
 *
 * Property: For any arbitrary `reference` and `text` strings, the formatted
 * clipboard string returned by `formatClipboardText(reference, text)` must
 * contain both the `reference` and `text` substrings.
 */

import { describe, it } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { formatClipboardText } from '../extension/newtab.js';

describe('P8 — Clipboard Format Contains Reference and Text', () => {
  test.prop([fc.string(), fc.string()])(
    'formatted clipboard string contains both reference and text substrings',
    (reference, text) => {
      const result = formatClipboardText(reference, text);

      // The result must be a string
      if (typeof result !== 'string') return false;

      // The result must contain the reference substring
      if (!result.includes(reference)) return false;

      // The result must contain the text substring
      if (!result.includes(text)) return false;

      return true;
    }
  );

  it('formats with em-dash separator as per the design spec', () => {
    const result = formatClipboardText('John 3:16', 'For God so loved the world');
    // Should contain both parts
    if (!result.includes('John 3:16')) throw new Error('Missing reference');
    if (!result.includes('For God so loved the world')) throw new Error('Missing text');
  });
});

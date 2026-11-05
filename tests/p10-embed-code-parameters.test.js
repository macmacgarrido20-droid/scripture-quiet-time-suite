/**
 * P10 — Embed Code Contains All Configuration Parameters
 *
 * Property: For arbitrary `{ theme, category, mode }` config objects,
 * `buildEmbedCode(config)` must return a string that:
 *   - Contains a valid `<iframe` opening tag
 *   - Contains a `src` attribute
 *   - Has a `src` URL whose query string includes `theme=<value>`,
 *     `category=<value>`, and `mode=<value>` matching the input exactly
 *
 * **Validates: Requirements 8.3, 8.4**
 */

import { describe } from 'vitest';
import { expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { buildEmbedCode } from '../web/configurator.js';

// ---------------------------------------------------------------------------
// Arbitraries — constrained to the valid option sets defined in the spec
// ---------------------------------------------------------------------------

const themeArb    = fc.constantFrom('light', 'dark');
const categoryArb = fc.constantFrom('', 'hope', 'peace', 'faith', 'gratitude');
const modeArb     = fc.constantFrom('daily', 'random');

/** Arbitrary config object matching the three configurator controls */
const configArb = fc.record({
  theme:    themeArb,
  category: categoryArb,
  mode:     modeArb,
});

// ---------------------------------------------------------------------------
// Helper — extract the src attribute value from an <iframe> string
// ---------------------------------------------------------------------------

/**
 * Parses `src="..."` from an iframe HTML string and returns the value.
 * Returns null if no src attribute is found.
 *
 * @param {string} iframeStr
 * @returns {string | null}
 */
function extractSrc(iframeStr) {
  const match = iframeStr.match(/\bsrc="([^"]*)"/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('P10 — embed code contains all configuration parameters', () => {
  /**
   * Property 10a: The output is a string containing a valid `<iframe` tag
   * and a `src` attribute.
   *
   * **Validates: Requirements 8.3**
   */
  test.prop([configArb])(
    'buildEmbedCode returns a string with an <iframe and a src attribute',
    (config) => {
      const result = buildEmbedCode(config);

      expect(typeof result).toBe('string');
      expect(result).toContain('<iframe');
      expect(result).toContain('src=');
    }
  );

  /**
   * Property 10b: The `src` URL query string contains `theme=<value>`,
   * `category=<value>`, and `mode=<value>` matching the input config exactly.
   *
   * We parse the src with URLSearchParams so we are robust to parameter
   * ordering, encoding, and extra whitespace in the attribute value.
   *
   * **Validates: Requirements 8.3, 8.4**
   */
  test.prop([configArb])(
    'src query string contains theme, category, and mode matching the input config',
    (config) => {
      const result = buildEmbedCode(config);

      // Extract the src value from the iframe string
      const src = extractSrc(result);
      expect(src).not.toBeNull();

      // Parse the query string portion of the src
      const queryStart = src.indexOf('?');
      expect(queryStart).toBeGreaterThanOrEqual(0);

      const params = new URLSearchParams(src.slice(queryStart + 1));

      // Each param must exactly match the input config value
      expect(params.get('theme')).toBe(config.theme);
      expect(params.get('category')).toBe(config.category);
      expect(params.get('mode')).toBe(config.mode);
    }
  );

  /**
   * Property 10c: All three required query parameters are present regardless
   * of which combination of values is supplied — including empty category.
   *
   * **Validates: Requirements 8.4**
   */
  test.prop([configArb])(
    'src query string always contains all three parameter keys',
    (config) => {
      const result = buildEmbedCode(config);
      const src = extractSrc(result);

      const queryStart = src.indexOf('?');
      const params = new URLSearchParams(src.slice(queryStart + 1));

      expect(params.has('theme')).toBe(true);
      expect(params.has('category')).toBe(true);
      expect(params.has('mode')).toBe(true);
    }
  );
});

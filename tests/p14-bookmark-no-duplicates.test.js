/**
 * P14 — Bookmark List Contains No Duplicates
 *
 * Property: After any sequence of toggleBookmark calls, the resulting list
 * contains no duplicate id values.
 *
 * **Validates: Requirements 12.5**
 */

import { describe, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { toggleBookmark } from '../web/dashboard.js';

const idArb = fc.string({ minLength: 1, maxLength: 20 });

// Generates a sequence of toggle operations (each is just an id string)
const toggleSequenceArb = fc.array(idArb, { minLength: 0, maxLength: 30 });

describe('P14 — Bookmark List Contains No Duplicates', () => {
  test.prop([toggleSequenceArb])(
    'any sequence of toggleBookmark calls never produces duplicate ids',
    (operations) => {
      let list = [];
      for (const id of operations) {
        list = toggleBookmark(id, list);
        // Check for duplicates after every operation
        expect(list.length).toBe(new Set(list).size);
      }
    }
  );

  test.prop([idArb])(
    'toggling the same id twice in a row leaves no duplicates',
    (id) => {
      let list = toggleBookmark(id, []);
      list = toggleBookmark(id, list);
      expect(list.length).toBe(new Set(list).size);
    }
  );
});

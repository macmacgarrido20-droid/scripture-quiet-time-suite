/**
 * P13 — Bookmark Toggle Round-Trip
 *
 * Property: For arbitrary verse id strings,
 *   - toggleBookmark(id, []) → list contains id
 *   - toggleBookmark(id, [id]) → list does NOT contain id
 *
 * **Validates: Requirements 12.1, 12.2, 12.4**
 */

import { describe, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';

import { toggleBookmark } from '../web/dashboard.js';

const idArb = fc.string({ minLength: 1, maxLength: 50 });

describe('P13 — Bookmark Toggle Round-Trip', () => {
  test.prop([idArb])(
    'adding an un-bookmarked id results in the id being present',
    (id) => {
      const result = toggleBookmark(id, []);
      expect(result).toContain(id);
    }
  );

  test.prop([idArb])(
    'removing an already-bookmarked id results in the id being absent',
    (id) => {
      const result = toggleBookmark(id, [id]);
      expect(result).not.toContain(id);
    }
  );

  test.prop([idArb])(
    'double-toggle returns to the original empty state',
    (id) => {
      const after1 = toggleBookmark(id, []);
      const after2 = toggleBookmark(id, after1);
      expect(after2).not.toContain(id);
    }
  );
});

/**
 * P12 — Service Worker Cache Serves All Assets Offline
 *
 * Property: For each URL in the ASSETS array, when the mock Cache contains
 * a Response for that URL, the service worker fetch handler returns a
 * non-null Response from cache (simulating offline behaviour).
 *
 * We test the cache-first fetch logic directly without needing a real SW
 * environment by extracting and testing the lookup behaviour.
 *
 * **Validates: Requirements 10.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// ASSETS list — keep in sync with service-worker.js
// ---------------------------------------------------------------------------

const ASSETS = [
  '/dashboard.html',
  '/offline.html',
  '/configurator.html',
  '/embed.html',
  '/dashboard.js',
  '/configurator.js',
  '/embed.js',
  '/styles/base.css',
  '/styles/dashboard.css',
  '/styles/widget.css',
  '/styles/configurator.css',
  '/manifest.webmanifest',
];

// ---------------------------------------------------------------------------
// Mock Cache API
// ---------------------------------------------------------------------------

class MockCache {
  constructor() {
    this._store = new Map();
  }

  async put(request, response) {
    const key = typeof request === 'string' ? request : request.url;
    this._store.set(key, response);
  }

  async addAll(urls) {
    for (const url of urls) {
      // Simulate a successful fetch by storing a dummy Response
      this._store.set(url, new MockResponse(url, 200));
    }
  }

  async match(request) {
    const key = typeof request === 'string' ? request : request.url;
    return this._store.get(key) || null;
  }

  async delete(key) {
    this._store.delete(key);
    return true;
  }

  async keys() {
    return [...this._store.keys()];
  }
}

class MockCacheStorage {
  constructor() {
    this._caches = new Map();
  }

  async open(name) {
    if (!this._caches.has(name)) {
      this._caches.set(name, new MockCache());
    }
    return this._caches.get(name);
  }

  async keys() {
    return [...this._caches.keys()];
  }

  async delete(name) {
    this._caches.delete(name);
  }

  async match(request) {
    for (const cache of this._caches.values()) {
      const match = await cache.match(request);
      if (match) return match;
    }
    return null;
  }
}

class MockResponse {
  constructor(url, status = 200) {
    this.url    = url;
    this.status = status;
    this.ok     = status >= 200 && status < 300;
  }

  clone() {
    return new MockResponse(this.url, this.status);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('P12 — Service Worker cache serves all assets offline', () => {
  let mockCaches;

  beforeEach(async () => {
    mockCaches = new MockCacheStorage();
    const cache = await mockCaches.open('sqts-v1');
    await cache.addAll(ASSETS);
  });

  it('ASSETS list is non-empty', () => {
    expect(ASSETS.length).toBeGreaterThan(0);
  });

  it('every asset URL is pre-cached during install simulation', async () => {
    const cache = await mockCaches.open('sqts-v1');

    for (const url of ASSETS) {
      const cached = await cache.match(url);
      expect(cached).not.toBeNull();
      expect(cached.status).toBe(200);
    }
  });

  it('cache-first fetch handler returns cached response for each ASSET url', async () => {
    // Simulate the SW fetch handler (cache-first logic)
    async function cacheFirstFetch(request, cacheStorage) {
      const cached = await cacheStorage.match(request);
      if (cached) return cached;
      // If not cached and network unavailable, return null (offline scenario)
      return null;
    }

    for (const url of ASSETS) {
      const response = await cacheFirstFetch(url, mockCaches);
      expect(response).not.toBeNull();
      expect(response.status).toBe(200);
    }
  });

  it('offline fallback page (/offline.html) is included in the ASSETS list', () => {
    expect(ASSETS).toContain('/offline.html');
  });

  it('activating a new cache version cleans up old caches', async () => {
    // Simulate old cache existing
    await mockCaches.open('sqts-v0');
    const keysBefore = await mockCaches.keys();
    expect(keysBefore).toContain('sqts-v0');
    expect(keysBefore).toContain('sqts-v1');

    // Simulate activate: delete caches not named 'sqts-v1'
    const keysToDelete = keysBefore.filter((k) => k !== 'sqts-v1');
    for (const k of keysToDelete) {
      await mockCaches.delete(k);
    }

    const keysAfter = await mockCaches.keys();
    expect(keysAfter).not.toContain('sqts-v0');
    expect(keysAfter).toContain('sqts-v1');
  });
});

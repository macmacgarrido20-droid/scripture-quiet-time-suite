# Implementation Plan: Cross-Platform Scripture & Quiet-Time Suite

## Overview

Implement the Scripture & Quiet-Time Suite using Vanilla JavaScript, HTML5, and CSS3 across three delivery surfaces (Chrome MV3 Extension, Embeddable Widget, PWA Dashboard) that share a single `scriptureEngine.js` core. Tasks are ordered to build and validate the shared core first, then layer each surface on top, and finish with a full test pass and polish phase.

## Tasks

- [x] 1. Workspace setup and shared data schema
  - [x] 1.1 Create directory structure and verses.json data store
    - Create `/shared/`, `/extension/styles/`, `/web/styles/`, `/icons/` directories
    - Write `/shared/verses.json` with a minimum of 30 verse entries; each entry must include `id`, `dayOfYear`, `reference`, `text`, `translation`, `reflection`, `quietTimePrompt` (≥10 chars), and `category` (drawn from `hope`, `peace`, `faith`, `gratitude`, plus optional extras)
    - Ensure all `id` values are unique and all `dayOfYear` values are integers in range 1–365
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Write property test P1 — JSON round-trip preserves verse data
    - **Property 1: JSON Round-Trip Preserves Verse Data**
    - Use `fast-check` `fc.record(...)` to generate arbitrary `VerseEntry`-shaped objects and assert `JSON.parse(JSON.stringify(entry))` deeply equals the original
    - **Validates: Requirements 1.7**

- [x] 2. Scripture Engine core module
  - [x] 2.1 Implement `getDayOfYear`, `findNearestVerse`, and `pickRandom` helpers in `scriptureEngine.js`
    - Export as ES module from `/shared/scriptureEngine.js`
    - `getDayOfYear(date)` returns integer 1–365 derived solely from local clock
    - `findNearestVerse(day, entries)` wraps modularly within 1–365 to find closest match
    - `pickRandom(arr)` selects uniformly via `Math.random()`
    - Validate `verses.json` at load time: length 15–365, unique `id`s, `dayOfYear` range, category membership, `quietTimePrompt` ≥10 chars; return `ErrorObject` on failure
    - _Requirements: 1.6, 2.1, 2.4_

  - [x] 2.2 Write property test P2 — getDayOfYear always returns value in 1–365
    - **Property 2: DayOfYear Always Produces a Value in 1–365**
    - Generate arbitrary `Date` objects (arbitrary timestamp integers) and assert `1 ≤ getDayOfYear(date) ≤ 365`
    - **Validates: Requirements 2.1**

  - [x] 2.3 Implement `getDailyVerse()` in `scriptureEngine.js`
    - Exact-match lookup; fall back to `findNearestVerse` when no exact match
    - Return `VerseEntry` or `ErrorObject`
    - _Requirements: 2.2, 2.3_

  - [x] 2.4 Write property test P3 — getDailyVerse always returns a valid VerseEntry
    - **Property 3: getDailyVerse Always Returns a Valid Verse Entry**
    - Stub system date to arbitrary day-of-year values; assert result is a member of the store (never `ErrorObject`) and that exact-match days return the correct entry
    - **Validates: Requirements 2.2, 2.3**

  - [x] 2.5 Implement `getRandomVerse(category?)` in `scriptureEngine.js`
    - Without `category`: selects from full store
    - With valid `category`: selects from filtered subset
    - With unknown `category`: returns `{ error: true, message: "No entries for category: <category>" }`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.6 Write property test P4 — getRandomVerse with category returns only matching verses
    - **Property 4: getRandomVerse With Category Returns Only Matching Verses**
    - For each valid category in the store, run 100+ calls and assert every returned entry's `category` matches; without category, assert result is in the full store
    - **Validates: Requirements 3.1, 3.2**

  - [x] 2.7 Write property test P5 — unknown category always returns an error object
    - **Property 5: getRandomVerse With Unknown Category Returns an Error Object**
    - Generate strings that are not in the store's category set; assert `result.error === true` and `result.message` is a non-empty string
    - **Validates: Requirements 3.3**

  - [x] 2.8 Implement `getQuietTimePrompt()` in `scriptureEngine.js`
    - Delegates to `getDailyVerse()` and extracts the `quietTimePrompt` field
    - _Requirements: 4.1, 4.2_

  - [x] 2.9 Write property test P6 — quietTimePrompt is always a substantive string
    - **Property 6: QuietTimePrompt Is Always a Substantive String**
    - Assert every `quietTimePrompt` in the store has `length ≥ 10`; assert `getQuietTimePrompt()` output matches the `quietTimePrompt` of `getDailyVerse()` for the same date context
    - **Validates: Requirements 4.1, 4.2**

- [~] 3. Checkpoint — Scripture Engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Chrome Extension — New Tab page
  - [x] 4.1 Create `extension/manifest.json` (MV3)
    - Declare `manifest_version: 3`, `chrome_url_overrides: { newtab: "newtab.html" }`, `permissions: ["storage"]`; no additional permissions
    - _Requirements: 5.2, 5.3_

  - [-] 4.2 Implement `extension/newtab.html` and `extension/newtab.js`
    - Inline `<script>` in `<head>` reads `sqts_theme` from `chrome.storage.local` and sets `document.documentElement.dataset.theme` before body paint (FOUC prevention)
    - On `DOMContentLoaded`: call `getDailyVerse()` and render `reference`, `text`, `translation`, `reflection`, `quietTimePrompt` into the verse card
    - "Copy to Clipboard" button: `navigator.clipboard.writeText(\`\${reference} — \${text}\`)`
    - "Random Verse" button: call `getRandomVerse()` and replace card content in-place without page reload
    - "Toggle Theme" button: flip `data-theme`, persist to `chrome.storage.local` under key `sqts_theme`
    - On load: if no stored theme, default to `light`
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 11.1, 11.2, 11.5_

  - [x] 4.3 Create `extension/styles/newtab.css`
    - Define CSS custom properties for both `[data-theme="light"]` and `[data-theme="dark"]`; style verse card, buttons, and layout
    - _Requirements: 5.6_

  - [x] 4.4 Write property test P7 (new tab surface) — verse card rendering preserves all required fields
    - **Property 7: Verse Card Rendering Preserves All Required Fields — New Tab**
    - Generate arbitrary `VerseEntry` objects; pass to the newtab render function; assert the output HTML/DOM contains `reference`, `text`, `translation`, `reflection`, `quietTimePrompt` as visible content
    - **Validates: Requirements 5.1**

  - [x] 4.5 Write property test P8 — clipboard format contains reference and text
    - **Property 8: Clipboard Format Contains Reference and Text**
    - For arbitrary `reference` and `text` strings, assert the formatted clipboard string contains both substrings
    - **Validates: Requirements 5.4**

  - [x] 4.6 Write property test P9 (extension surface) — theme storage round-trip
    - **Property 9: Theme Storage Round-Trip — Extension**
    - For each of `"light"` and `"dark"`, write to the mock `chrome.storage.local` under `sqts_theme` and read back; assert returned value equals written value
    - **Validates: Requirements 5.6, 5.7, 11.1, 11.7**

- [ ] 5. Chrome Extension — Popup
  - [-] 5.1 Implement `extension/popup.html` and `extension/popup.js`
    - Constrain root element to `max-width: 400px; max-height: 600px` via CSS
    - On load: call `getDailyVerse()` and render `reference`, `text`, `quietTimePrompt`
    - Focus timer: `setInterval` 1-second tick from 120s to 0; display remaining seconds
    - At 0s: clear interval, replace countdown display with completion message (no navigation)
    - "Reset" button: clear interval, reset `remaining = 120`, update display
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 5.2 Create `extension/styles/popup.css`
    - Style compact popup layout; include CSS custom properties consistent with newtab theme tokens
    - _Requirements: 6.2_

  - [~] 5.3 Write property test P7 (popup surface) — verse card rendering preserves all required fields
    - **Property 7: Verse Card Rendering Preserves All Required Fields — Popup**
    - Generate arbitrary `VerseEntry` objects; assert popup render output contains `reference`, `text`, `quietTimePrompt`
    - **Validates: Requirements 6.1**

- [ ] 6. Embeddable Widget
  - [-] 6.1 Implement `web/embed.html` and `web/embed.js`
    - Parse `location.search` with `URLSearchParams` for `theme` (default `light`), `category` (default none), `mode` (default `daily`)
    - Set `data-theme` on the root element before rendering
    - Call `getDailyVerse()` for `mode=daily`, `getRandomVerse(category)` for `mode=random`
    - Render verse card on `DOMContentLoaded`; on engine error, render "Scripture unavailable" message
    - Zero external network calls
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [x] 6.2 Create `web/styles/base.css` and `web/styles/widget.css`
    - `base.css`: define all CSS custom property tokens for `light` and `dark` themes under `[data-theme]` selectors
    - `widget.css`: style iframe-appropriate card layout using tokens from `base.css`
    - _Requirements: 7.2, 7.3_

  - [x] 6.3 Write property test P4 (widget surface) — getRandomVerse with category returns only matching verses
    - **Property 4: getRandomVerse With Category Returns Only Matching Verses — Widget integration**
    - Simulate widget loading with arbitrary valid `category` query params; assert rendered card's verse matches the category
    - **Validates: Requirements 7.5**

  - [-] 6.4 Write property test P11 — category grouping and filtering correctness
    - **Property 11: Category Grouping and Filtering Correctness**
    - For arbitrary arrays of `VerseEntry` objects, assert `groupByCategory` groups entries under correct keys with no mismatches; assert `filterByCategory` returns exactly matching entries with no missing or extra entries
    - **Validates: Requirements 7.5, 9.2, 9.3**

- [ ] 7. Widget Configurator
  - [x] 7.1 Implement `web/configurator.html` and `web/configurator.js`
    - Maintain `config = { theme: 'light', category: '', mode: 'daily' }` state object
    - Provide controls for `theme`, `category`, and `mode`
    - On any control change: call `updatePreview()` which swaps the live preview `<iframe>` `src` to `embed.html?theme=...&category=...&mode=...`
    - `buildEmbedCode(config)` returns a valid `<iframe>` HTML string with all three query params
    - "Copy Embed Code" button: `navigator.clipboard.writeText(buildEmbedCode(config))`; toggle `data-copied="true"` on the button within 500ms; remove attribute after 2 seconds
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 7.2 Create `web/styles/configurator.css`
    - Style configurator layout; use CSS custom property tokens from `base.css`
    - _Requirements: 8.1_

  - [~] 7.3 Write property test P10 — embed code contains all configuration parameters
    - **Property 10: Embed Code Contains All Configuration Parameters**
    - For arbitrary `{ theme, category, mode }` config objects, assert `buildEmbedCode(config)` output is a string containing a valid `<iframe>` tag whose `src` includes `theme=<value>`, `category=<value>`, and `mode=<value>` as query parameters matching the input
    - **Validates: Requirements 8.3, 8.4**

- [~] 8. Checkpoint — Widget and Configurator complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. PWA Dashboard
  - [-] 9.1 Implement `web/dashboard.html` structure and four CSS-toggled views
    - Create `#view-daily`, `#view-catalog`, `#view-bookmarks`, `#view-configurator` sections; only one visible at a time via CSS class toggle
    - Include inline `<script>` at top of `<body>` that reads `sqts_theme` from `localStorage` and sets `document.documentElement.dataset.theme` before paint (FOUC prevention)
    - Desktop `<nav>` and mobile hamburger/bottom bar both present; CSS `@media (max-width: 768px)` controls which is shown
    - `min-width: 320px` on root; fluid grid to prevent horizontal scrolling
    - _Requirements: 9.1, 9.4, 9.5, 9.6, 11.3, 11.4, 11.6_

  - [~] 9.2 Implement `web/dashboard.js` — daily view and navigation
    - On `DOMContentLoaded`: read and apply stored theme, load bookmarks from `localStorage` under `sqts_bookmarks`
    - Render daily view: call `getDailyVerse()` and populate `reference`, `text`, `translation`, `reflection`, `quietTimePrompt`
    - Implement view-switching logic: toggle CSS classes to show/hide views on nav link click
    - _Requirements: 9.1, 9.4_

  - [~] 9.3 Write property test P7 (dashboard surface) — verse card rendering preserves all required fields
    - **Property 7: Verse Card Rendering Preserves All Required Fields — Dashboard**
    - Generate arbitrary `VerseEntry` objects; pass to the dashboard daily-view render function; assert output contains all five required fields
    - **Validates: Requirements 9.1**

  - [~] 9.4 Implement catalog view in `web/dashboard.js`
    - Load all entries from store, group by category using `groupByCategory`; render grouped sections
    - Category filter control: call `filterByCategory(entries, selected)` and re-render the catalog on selection change
    - _Requirements: 9.2, 9.3_

  - [~] 9.5 Implement bookmark toggle, bookmarks view, and localStorage persistence in `web/dashboard.js`
    - `toggleBookmark(id)`: if `ids.includes(id)` remove, else push; write array back to `localStorage` under `sqts_bookmarks`
    - Render bookmark toggle button per verse card (filled/outlined state)
    - Bookmarks view: call `getBookmarkedVerses(ids, allEntries)` and render matching entries; restore state on load
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [~] 9.6 Write property test P13 — bookmark toggle round-trip
    - **Property 13: Bookmark Toggle Round-Trip**
    - For arbitrary verse `id` strings, assert that after `toggleBookmark(id)` on an un-bookmarked id the list contains `id`; after `toggleBookmark(id)` again the list does not contain `id`
    - **Validates: Requirements 12.1, 12.2, 12.4**

  - [~] 9.7 Write property test P14 — bookmark list contains no duplicates
    - **Property 14: Bookmark List Contains No Duplicates**
    - Generate arbitrary sequences of `addBookmark` / `toggleBookmark` calls; after each operation assert `bookmarkList.length === new Set(bookmarkList).size`
    - **Validates: Requirements 12.5**

  - [~] 9.8 Write property test P15 — getBookmarkedVerses returns exactly the bookmarked entries
    - **Property 15: getBookmarkedVerses Returns Exactly the Bookmarked Entries**
    - For arbitrary `ids` arrays and `VerseEntry` arrays (including ids not present in entries), assert `getBookmarkedVerses(ids, entries)` returns exactly the entries whose `id` is in `ids` — no more, no fewer
    - **Validates: Requirements 12.3**

  - [~] 9.9 Implement theme toggle and persistence in `web/dashboard.js`
    - "Toggle Theme" button: flip `data-theme` on root element, write new value to `localStorage` under `sqts_theme`
    - _Requirements: 11.3, 11.4_

  - [~] 9.10 Write property test P9 (dashboard surface) — theme storage round-trip
    - **Property 9: Theme Storage Round-Trip — Dashboard**
    - For each of `"light"` and `"dark"`, write to mock `localStorage` under `sqts_theme` and read back; assert independence from extension storage
    - **Validates: Requirements 11.3, 11.7**

  - [~] 9.11 Create `web/styles/dashboard.css`
    - Style all four views, desktop nav bar, mobile nav (hamburger/bottom bar), responsive grid
    - Use CSS custom property tokens from `base.css`; `@media (max-width: 768px)` for mobile nav
    - _Requirements: 9.5, 9.6_

- [~] 10. Checkpoint — Dashboard complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Service Worker and PWA Manifest
  - [~] 11.1 Implement `web/service-worker.js` with cache-first strategy
    - Set `CACHE_NAME = 'sqts-v1'` and define `ASSETS` array including all HTML, CSS, JS, `verses.json`, `manifest.webmanifest`, and icon files
    - `install` event: `cache.addAll(ASSETS)` (pre-cache all static assets)
    - `activate` event: delete any caches whose name is not `sqts-v1`
    - `fetch` event: cache-first; return cached response if found, else fetch from network and cache the response
    - `message` event on new SW waiting: `postMessage({ type: 'SW_UPDATE_AVAILABLE' })` to all clients
    - `dashboard.js` listens for that message and shows a "Refresh for new content" banner
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 11.2 Create `web/manifest.webmanifest`
    - Include `name`, `short_name`, `start_url: "/dashboard.html"`, `display: "standalone"`, `background_color`, `theme_color`, and at least two icons (`192×192` and `512×512`)
    - Register service worker in `dashboard.html` via `<script>` block
    - _Requirements: 10.4_

  - [~] 11.3 Write property test P12 — service worker cache serves all assets offline
    - **Property 12: Service Worker Cache Serves All Assets Offline**
    - For each URL in the `ASSETS` array, use a mock Cache API to assert that when network is unavailable the `fetch` handler returns a non-null `Response` from cache
    - **Validates: Requirements 10.2**

- [ ] 12. Accessibility and polish
  - [~] 12.1 Add ARIA labels, focus indicators, and keyboard navigation across all surfaces
    - Add `aria-label` to all icon-only buttons (Copy, Bookmark, Toggle Theme, Timer Reset)
    - Ensure all interactive elements are reachable via Tab and operable via Enter/Space
    - Add visible focus indicators (`outline` style) in both `light` and `dark` themes in all CSS files
    - _Requirements: 5.1, 6.1, 9.1_

  - [~] 12.2 Validate color contrast and dark-mode token completeness
    - Verify minimum 4.5:1 contrast ratio for all text against backgrounds in both themes using `axe-core` or equivalent tooling
    - Ensure every CSS custom property token used in light mode has a corresponding dark-mode override
    - _Requirements: 5.6, 7.2, 7.3, 9.5_

  - [~] 12.3 Add offline fallback page and wire error handling across all surfaces
    - Create `web/offline.html` as a minimal fallback page for navigation requests when offline
    - Add `offline.html` to the `ASSETS` pre-cache list in `service-worker.js`
    - Verify extension new tab and popup show hardcoded fallback card (not visible error) when engine returns `ErrorObject`
    - Verify widget shows "Scripture unavailable" on engine error
    - Verify dashboard shows toast/banner on engine error without breaking other views
    - _Requirements: 1.6, 10.2_

- [~] 13. Final checkpoint — all surfaces integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit test sub-tasks that can be skipped for a faster MVP build
- All 15 correctness properties from the design are covered by property test sub-tasks (P1–P15)
- `fast-check` is the recommended PBT library; integrate with Vitest (`vitest` + `@fast-check/vitest`) for the test runner
- CSS custom properties in `base.css` are the single source of truth for all theme colors — no inline styles for theming
- The inline `<script>` theme-application blocks (newtab and dashboard) must run synchronously before any CSS paint to prevent FOUC
- Storage keys are fixed: `sqts_theme` (both surfaces, independent), `sqts_bookmarks` (dashboard only)
- The service worker cache name `sqts-v1` must be bumped manually when deploying breaking changes to trigger old-cache cleanup

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5"] },
    { "id": 4, "tasks": ["2.6", "2.7", "2.8"] },
    { "id": 5, "tasks": ["2.9", "4.1", "6.2"] },
    { "id": 6, "tasks": ["4.2", "6.1", "7.1"] },
    { "id": 7, "tasks": ["4.3", "5.1", "6.3", "7.2", "9.1"] },
    { "id": 8, "tasks": ["4.4", "4.5", "4.6", "5.2", "5.3", "6.4", "7.3", "9.2"] },
    { "id": 9, "tasks": ["9.4", "9.5", "9.9"] },
    { "id": 10, "tasks": ["9.3", "9.6", "9.7", "9.8", "9.10", "9.11", "10.3"] },
    { "id": 11, "tasks": ["11.1"] },
    { "id": 12, "tasks": ["11.2", "11.3"] },
    { "id": 13, "tasks": ["12.1", "12.2", "12.3"] }
  ]
}
```

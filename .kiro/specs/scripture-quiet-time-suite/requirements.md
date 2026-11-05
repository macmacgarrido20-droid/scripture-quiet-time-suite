# Requirements Document

## Introduction

The Cross-Platform Scripture & Quiet-Time Suite is a lightweight, zero-database, multi-channel scripture application. It serves daily Bible verses, reflections, and quiet-time prompts across three delivery channels: a Chrome/Edge Extension (Manifest V3), an Embeddable Social Web Widget, and a Responsive Progressive Web App (PWA) Dashboard. All verse data is stored in a static local `verses.json` file, with no external API calls required for core functionality. User preferences and bookmarks are persisted via `chrome.storage.local` (extension) and `localStorage` (web app).

## Glossary

- **Scripture_Engine**: The shared JavaScript utility module (`scriptureEngine.js`) responsible for all verse retrieval and date logic.
- **Verses_Store**: The static `verses.json` file containing all pre-populated verse data.
- **Extension**: The Chrome/Edge browser extension built on Manifest V3.
- **Widget**: The embeddable, self-contained iframe/script card for use on third-party sites.
- **Dashboard**: The responsive Progressive Web App (PWA) web page.
- **DayOfYear**: An integer from 1 to 365 representing the ordinal day in the current calendar year.
- **Daily_Verse**: The verse entry whose `dayOfYear` field matches the current system DayOfYear.
- **Category**: A thematic label assigned to each verse entry (e.g., `hope`, `peace`, `faith`, `gratitude`).
- **Quiet_Time_Prompt**: A short, meditative challenge or question paired with a verse entry.
- **Reflection**: A brief contextual commentary paired with a verse entry.
- **Theme**: The visual color scheme applied to a UI surface, either `light` or `dark`.
- **Configurator**: The Widget Configurator Page for customizing and generating embed codes.
- **Service_Worker**: The background script enabling offline caching for the PWA Dashboard.
- **Embed_Code**: An HTML `<iframe>` or `<script>` snippet that third-party sites paste to embed the Widget.

---

## Requirements

### Requirement 1: Static Verse Data Store

**User Story:** As a developer, I want a structured static data file with at least 15–30 pre-populated verse entries, so that the application can deliver scripture content without a database or network dependency.

#### Acceptance Criteria

1. THE Verses_Store SHALL contain a minimum of 15 verse entries and a maximum of 365 verse entries at initial delivery.
2. THE Verses_Store SHALL contain entries where each entry includes the fields: `id`, `dayOfYear`, `reference`, `text`, `translation`, `reflection`, `quietTimePrompt`, and `category`.
3. THE Verses_Store SHALL assign each entry a unique `id` value.
4. THE Verses_Store SHALL assign each entry a `dayOfYear` value that is an integer in the range 1 to 365 inclusive.
5. THE Verses_Store SHALL assign each entry a `category` value drawn from a defined set of thematic labels including at minimum `hope`, `peace`, `faith`, and `gratitude`.
6. IF the Verses_Store file is malformed or unparseable, THEN THE Scripture_Engine SHALL return a descriptive error message identifying the parse failure.
7. THE Verses_Store SHALL be valid JSON conforming to a defined schema so that parsing then serializing then parsing the file produces an equivalent data structure (round-trip property).

---

### Requirement 2: Scripture Engine — Daily Verse Retrieval

**User Story:** As a user, I want the app to automatically show me the verse assigned to today's date, so that I receive a fresh, contextually timed scripture each day.

#### Acceptance Criteria

1. WHEN `getDailyVerse()` is called, THE Scripture_Engine SHALL calculate the current DayOfYear from the system date.
2. WHEN `getDailyVerse()` is called and a verse entry with a matching `dayOfYear` exists in the Verses_Store, THE Scripture_Engine SHALL return that verse entry.
3. WHEN `getDailyVerse()` is called and no verse entry matches the current DayOfYear, THE Scripture_Engine SHALL return the verse entry whose `dayOfYear` value is closest to the current DayOfYear using modular wrapping within the range 1 to 365.
4. THE Scripture_Engine SHALL derive DayOfYear solely from the local system clock without making any external network calls.

---

### Requirement 3: Scripture Engine — Random Verse Retrieval

**User Story:** As a user, I want to request a random verse optionally filtered by theme, so that I can explore scripture outside of today's scheduled reading.

#### Acceptance Criteria

1. WHEN `getRandomVerse()` is called without a category argument, THE Scripture_Engine SHALL return a verse entry selected uniformly at random from the full Verses_Store.
2. WHEN `getRandomVerse(category)` is called with a valid category, THE Scripture_Engine SHALL return a verse entry selected uniformly at random from only the entries whose `category` field matches the provided category.
3. IF `getRandomVerse(category)` is called with a category for which no entries exist in the Verses_Store, THEN THE Scripture_Engine SHALL return an error object with a descriptive message indicating no entries exist for that category.
4. WHEN `getRandomVerse()` is called multiple times in succession, THE Scripture_Engine SHALL produce results that are not deterministically identical on every call, demonstrating non-deterministic selection.

---

### Requirement 4: Scripture Engine — Quiet-Time Prompt Retrieval

**User Story:** As a user, I want to receive a short meditative prompt alongside my daily verse, so that I have a structured moment of reflection.

#### Acceptance Criteria

1. WHEN `getQuietTimePrompt()` is called, THE Scripture_Engine SHALL return the `quietTimePrompt` string from the current Daily_Verse entry.
2. THE Scripture_Engine SHALL return a `quietTimePrompt` value that is a non-empty string of at least 10 characters.

---

### Requirement 5: Chrome Extension — New Tab Override

**User Story:** As a browser user, I want the Extension to replace my new tab page with today's scripture and reflection, so that every new tab becomes a moment of quiet focus.

#### Acceptance Criteria

1. WHEN a new browser tab is opened, THE Extension SHALL replace the default new tab page with a page displaying the Daily_Verse `reference`, `text`, `translation`, `reflection`, and `quietTimePrompt`.
2. THE Extension SHALL declare `chrome_url_overrides` with `newtab` in `manifest.json` using Manifest V3.
3. THE Extension SHALL request only the `storage` permission in `manifest.json` and no additional permissions.
4. WHEN the "Copy to Clipboard" button is activated, THE Extension SHALL copy the verse `reference` and `text` to the system clipboard as a formatted string.
5. WHEN the "Random Verse" button is activated, THE Extension SHALL call `getRandomVerse()` and replace the displayed verse card with the returned entry without reloading the page.
6. WHEN the "Toggle Theme" button is activated, THE Extension SHALL switch the new tab page between `light` and `dark` Theme and persist the selected Theme using `chrome.storage.local`.
7. WHILE a Theme preference is stored in `chrome.storage.local`, THE Extension SHALL apply that stored Theme on every subsequent new tab page load.

---

### Requirement 6: Chrome Extension — Popup Feed

**User Story:** As a browser user, I want a compact popup showing today's scripture and a quiet-time focus timer, so that I can access scripture without opening a full new tab.

#### Acceptance Criteria

1. WHEN the Extension toolbar icon is clicked, THE Extension SHALL display a popup card containing the Daily_Verse `reference`, `text`, and `quietTimePrompt`.
2. THE Extension popup SHALL render within a viewport of no more than 400px wide and 600px tall.
3. WHEN the quiet-time focus timer is started, THE Extension SHALL count down from 120 seconds to 0 and display the remaining time in seconds.
4. WHEN the focus timer reaches 0 seconds, THE Extension SHALL display a completion message within the popup without navigating away from the popup.
5. WHEN the focus timer is running, THE Extension SHALL allow the user to reset the timer back to 120 seconds.

---

### Requirement 7: Embeddable Web Widget

**User Story:** As a site owner, I want to embed a self-contained scripture card on my Notion page, WordPress blog, or personal site via an iframe, so that my visitors see daily or random scripture without me hosting a backend.

#### Acceptance Criteria

1. THE Widget SHALL be deliverable as a self-contained `<iframe>` embed pointing to a hosted `embed.html` file.
2. WHEN the Widget is loaded with the query parameter `?theme=dark`, THE Widget SHALL apply the `dark` Theme to its card UI.
3. WHEN the Widget is loaded with the query parameter `?theme=light`, THE Widget SHALL apply the `light` Theme to its card UI.
4. WHEN the Widget is loaded without a `theme` query parameter, THE Widget SHALL default to the `light` Theme.
5. WHEN the Widget is loaded with the query parameter `?category=<value>`, THE Widget SHALL display only verses whose `category` matches the provided value.
6. WHEN the Widget is loaded with the query parameter `?mode=daily`, THE Widget SHALL display the Daily_Verse.
7. WHEN the Widget is loaded with the query parameter `?mode=random`, THE Widget SHALL display a randomly selected verse on each page load.
8. WHEN the Widget is loaded without a `mode` query parameter, THE Widget SHALL default to `mode=daily` behavior.
9. THE Widget SHALL make zero external API calls during its normal operation.
10. THE Widget SHALL load and render its initial content within 100 milliseconds on a page where the host document has already loaded.

---

### Requirement 8: Widget Configurator Page

**User Story:** As a site owner, I want a visual configurator tool that lets me customize the widget's colors and mode and then copies the embed code to my clipboard, so that I can integrate scripture into my site without writing code.

#### Acceptance Criteria

1. THE Configurator SHALL provide controls for selecting Theme (`light` or `dark`), category, and display mode (`daily` or `random`).
2. WHEN any Configurator control is changed, THE Configurator SHALL update a live preview of the Widget card in real time without requiring a page reload.
3. WHEN the "Copy Embed Code" button is activated, THE Configurator SHALL copy a valid HTML `<iframe>` Embed_Code string to the system clipboard reflecting the current configuration.
4. THE Embed_Code produced by the Configurator SHALL include the configured `theme`, `category`, and `mode` query parameters in the `<iframe>` `src` attribute.
5. WHEN the "Copy Embed Code" button is activated, THE Configurator SHALL display a confirmation message to the user within 500 milliseconds of the button activation.

---

### Requirement 9: Responsive PWA Dashboard

**User Story:** As a user on any device, I want a clean, mobile-ready web dashboard where I can read today's verse, browse verses by theme, and access the Widget Configurator, so that I have a full scripture reference experience in my browser.

#### Acceptance Criteria

1. THE Dashboard SHALL display the Daily_Verse `reference`, `text`, `translation`, `reflection`, and `quietTimePrompt` on the main view.
2. THE Dashboard SHALL provide a catalog browser that displays all verse entries grouped by Category.
3. WHEN a user selects a Category in the catalog browser, THE Dashboard SHALL display only the verse entries whose `category` matches the selected Category.
4. THE Dashboard SHALL include the Configurator as an embedded section or linked page within the same web application.
5. THE Dashboard SHALL be responsive and render without horizontal scrolling on viewports as narrow as 320px.
6. WHEN the Dashboard is loaded on a mobile-sized viewport (width ≤ 768px), THE Dashboard SHALL present navigation in a mobile-friendly layout such as a hamburger menu or bottom navigation bar.
7. THE Dashboard SHALL achieve a First Contentful Paint within 100 milliseconds when loaded from the service worker cache on a device with no active network connection.

---

### Requirement 10: Offline Capability via Service Worker

**User Story:** As a PWA user, I want the Dashboard to work fully offline after the first load, so that I can read scripture even without an internet connection.

#### Acceptance Criteria

1. THE Service_Worker SHALL cache all static assets required by the Dashboard on the first successful load, including HTML, CSS, JavaScript, and the Verses_Store file.
2. WHEN the Dashboard is loaded and a network connection is unavailable, THE Service_Worker SHALL serve all cached static assets without making any network requests.
3. WHEN a new version of the Dashboard is deployed, THE Service_Worker SHALL detect the update and notify the user that a refresh is available.
4. THE Dashboard SHALL include a valid Web App Manifest file (`manifest.json`) declaring at minimum the application name, short name, start URL, display mode, and at least one icon.

---

### Requirement 11: Theme Persistence

**User Story:** As a user, I want my chosen theme to be remembered across sessions on both the extension and the web app, so that I do not have to reselect my preferred appearance each time.

#### Acceptance Criteria

1. WHEN the user changes the Theme in the Extension, THE Extension SHALL persist the selected Theme value in `chrome.storage.local` under a defined key.
2. WHEN the Extension new tab page loads, THE Extension SHALL read the Theme value from `chrome.storage.local` and apply it before rendering the page content.
3. WHEN the user changes the Theme in the Dashboard, THE Dashboard SHALL persist the selected Theme value in `localStorage` under a defined key.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the Theme value from `localStorage` and apply it before rendering the page content, preventing a flash of unstyled content.
5. IF no Theme value is stored in `chrome.storage.local`, THEN THE Extension SHALL default to the `light` Theme.
6. IF no Theme value is stored in `localStorage`, THEN THE Dashboard SHALL default to the `light` Theme.
7. THE Extension Theme setting and THE Dashboard Theme setting SHALL be stored and managed independently, with no synchronization between the two surfaces.

---

### Requirement 12: Bookmarking Verses

**User Story:** As a user, I want to bookmark verses I find meaningful, so that I can easily return to them later.

#### Acceptance Criteria

1. WHEN the user activates the bookmark action on a verse card in the Dashboard, THE Dashboard SHALL add the verse `id` to a bookmarks list persisted in `localStorage`.
2. WHEN the user activates the bookmark action on a verse already in the bookmarks list, THE Dashboard SHALL remove the verse `id` from the bookmarks list in `localStorage`.
3. THE Dashboard SHALL provide a dedicated bookmarks view that displays all verse entries whose `id` values are present in the stored bookmarks list.
4. WHEN the Dashboard loads, THE Dashboard SHALL restore the bookmarks list from `localStorage` so that previously bookmarked verses are shown as bookmarked.
5. THE bookmarks list in `localStorage` SHALL contain no duplicate verse `id` values at any time.

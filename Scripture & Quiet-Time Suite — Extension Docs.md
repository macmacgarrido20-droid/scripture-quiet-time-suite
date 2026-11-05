# Scripture & Quiet-Time Suite
### Chrome Browser Extension — Complete Guide

---

## What Is This?

This is a **Chrome browser extension** that changes your new tab page into a daily Bible verse page. Every time you open a new tab, instead of seeing Google, you see a Bible verse with a reflection question and a beautiful background.

It works **completely offline** — no internet needed after installation.

---

## What It Looks Like

When you open a new tab, you see:

```
┌─────────────────────────────────────────────────────┐
│ ✝ Scripture & Quiet-Time    🌙    [NIV] [ESV] [MBB] │  ← Top bar
├─────────────────────────────────────────────────────┤
│                                                     │
│  Thursday, November 5, 2026                         │  ← Today's date
│                                                     │
│  🔍 [ Search Google...                          → ] │  ← Google search
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  [FAITH]                                      │  │  ← Category badge
│  │  Matthew 17:20                                │  │  ← Bible reference
│  │                                               │  │
│  │  "Truly I tell you, if you have faith as      │  │  ← Verse text
│  │   small as a mustard seed..."                 │  │
│  │                                               │  │
│  │  NIV                                          │  │  ← Translation
│  │  ─────────────────────────────────────────   │  │
│  │  🕊 Reflection                                │  │
│  │  What 'mountain' in your life feels           │  │  ← Question to think about
│  │  immovable? Offer it to God in faith.         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [📋 Copy]    [🎲 Random]                           │  ← Action buttons
│                                                     │
│         Every new tab, a moment with God.           │  ← Footer
└─────────────────────────────────────────────────────┘
```

The background behind everything is a **beautiful animated gradient** that matches the verse category:
- 🌅 **Hope** → Warm sunrise (gold and rose)
- 🌊 **Peace** → Calm ocean (blue and teal)
- ⛰️ **Faith** → Mountain dawn (purple and gold)
- 🌿 **Gratitude** → Golden meadow (green and amber)

---

## The Two Parts of the Extension

### 1. New Tab Page
This is what you see when you open a new tab. It has:
- Today's date
- Google search bar (auto-focused — just start typing)
- Verse card with the Bible verse
- Background scene based on the verse category

### 2. Popup
This is what you see when you **click the extension icon** in the Chrome toolbar. It has:
- Today's verse (reference + text + reflection question)
- A **2-minute focus timer** that counts down from 120 seconds
- When it reaches 0, it shows "✅ Focus time complete. Well done!"
- A Reset button to restart the timer

---

## The Buttons

### Top Bar Buttons

| Button | What it does |
|---|---|
| 🌙 (moon icon) | Switches between **light mode** and **dark mode**. It remembers your choice. |
| **NIV** | Shows the verse in English (New International Version) |
| **ESV** | Shows the verse in English (English Standard Version — slightly different wording) |
| **MBB** | Shows the verse in **Tagalog** (Magandang Balita Biblia) |

### Action Buttons (below the verse card)

| Button | What it does |
|---|---|
| 📋 **Copy** | Copies the verse reference and text to your clipboard. The button briefly shows "Copied!" to confirm. |
| 🎲 **Random** | Shows a random verse from the collection. The card bounces with a little animation, and the background changes to match the new verse category. |

---

## The Bible Translations

You can switch between 3 translations by clicking the buttons in the top bar:

| Button | Full name | Language |
|---|---|---|
| **NIV** | New International Version | English |
| **ESV** | English Standard Version | English |
| **MBB** | Magandang Balita Biblia | Tagalog / Filipino |

**Example — John 3:16 in each translation:**

> **NIV:** "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."

> **ESV:** "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."

> **MBB:** "Sapagkat gayon na lamang ang pagmamahal ng Diyos sa mundo, kaya ibinigay niya ang kanyang kaisa-isang Anak, upang ang sinumang sumampalataya sa kanya ay hindi mapahamak, kundi magkaroon ng buhay na walang hanggan."

The translation you choose is **remembered** — even after you close and reopen Chrome.

---

## The Verses

- There are **132 Bible verses** in total
- They are spread across all **365 days of the year** — one verse per day
- Every day you get a different verse based on today's date
- If today's date doesn't have an exact verse, the nearest one is used
- All verses are from the **NIV, ESV, and MBB** translations
- 69 verses have all 3 translations. The other 63 use NIV for ESV and MBB (until manually added)

### The 4 Categories

| Category | Theme | Example verse |
|---|---|---|
| **Hope** | God's promises, future, encouragement | Jeremiah 29:11, Isaiah 40:31 |
| **Peace** | Rest, trust, stillness | Philippians 4:7, John 14:27 |
| **Faith** | Trust, belief, courage | Hebrews 11:1, Joshua 1:9 |
| **Gratitude** | Thankfulness, praise, gifts | Psalm 100:4, James 1:17 |

Each category has **33 verses** — evenly balanced.

---

## What Gets Remembered (Saved Settings)

The extension saves 2 things to Chrome's storage. These persist even after restarting Chrome:

| Setting | Default | Where it's saved |
|---|---|---|
| Your **theme** (light/dark) | Light | `chrome.storage.local` → key: `sqts_theme` |
| Your **translation** (NIV/ESV/MBB) | NIV | `chrome.storage.local` → key: `sqts_translation` |

These are saved **only on your device** — they don't sync to other devices.

---

## How to Install / Reload

### First time installation:
1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder from your project
5. Open a new tab — you should see the extension

### After making changes:
1. Go to `chrome://extensions`
2. Click the **↺ refresh** button on your extension card
3. Open a new tab to see the changes

### If new tab still shows Google:
1. Go to `chrome://settings/onStartup`
2. Select **"Open the New Tab page"**
3. Make sure Scripture & Quiet-Time Suite is listed as controlling it

---

## How to Add More Verses

1. Open `shared/verses.json` in a text editor
2. Add a new entry at the end of the `verses` array, following this format:

```json
{
  "id": "v133",
  "dayOfYear": 325,
  "reference": "Psalm 23:6",
  "translations": {
    "NIV": "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever.",
    "ESV": "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the LORD forever.",
    "MBB": "Tiyak na ang kabutihan at pag-ibig mo ay susundan ako sa lahat ng araw ng aking buhay, at mananahan ako sa bahay ng Panginoon magpakailanman."
  },
  "reflection": "God promises His goodness follows us — not just ahead of us, but behind us too.",
  "quietTimePrompt": "Where have you seen God's goodness following you this week? Reflect on that now.",
  "category": "hope"
}
```

3. Copy the file to the extension folder:
```
Copy-Item "shared\verses.json" "extension\verses.json"
```
4. Reload the extension in Chrome

**Rules for new verses:**
- `id` must be unique (v133, v134, v135...)
- `dayOfYear` must be a number from 1 to 365, not already used
- `category` must be one of: `hope`, `peace`, `faith`, `gratitude`
- `quietTimePrompt` must be at least 10 characters long
- Maximum 365 verses total

---

## How to Change Icons

The current icons are plain green squares. To replace them with real artwork:

1. Create 3 PNG image files:
   - `icon16.png` — 16×16 pixels
   - `icon48.png` — 48×48 pixels
   - `icon128.png` — 128×128 pixels
2. Replace the files in `extension/icons/`
3. Reload the extension

---

## The Files — Plain English Explanation

| File | What it does |
|---|---|
| `manifest.json` | The ID card of the extension. Tells Chrome the name, version, what it can do, and what permissions it needs. |
| `newtab.html` | The structure/layout of the new tab page (like a blueprint). |
| `newtab.js` | The brain of the new tab page. Loads the verse, handles buttons, switches themes and translations. |
| `newtab-init.js` | Runs first before anything else. Applies your saved theme so the page doesn't flash white before going dark. Also shows today's date. |
| `newtab.css` | The visual design — colors, fonts, animations, background scenes. |
| `popup.html` | The layout of the small popup that appears when you click the toolbar icon. |
| `popup.js` | Makes the popup work — loads the verse and runs the 2-minute focus timer. |
| `popup.css` | The visual design for the popup. |
| `scriptureEngine.js` | The "engine" that picks the right verse for today, picks random verses, and handles the NIV/ESV/MBB text lookup. |
| `verses.json` | The Bible verse database — all 132 verses with their text in 3 languages. |
| `icons/` | The extension icons shown in Chrome's toolbar and extension list. |

---

## Known Issues

| Issue | Explanation | How to fix |
|---|---|---|
| Green square icon | The icons are placeholder images | Replace the PNG files in `extension/icons/` |
| Some verses only show NIV for ESV/MBB | 63 verses don't have Tagalog or ESV text yet | Add the text manually to `verses.json` |
| Settings don't sync between devices | Chrome's local storage is device-only | Currently by design |

---

## Running the Tests

The project has **56 automated tests** to verify everything works correctly.

To run them:
```
cd e:\Mac_folder\Comsci\mark_project\SharingtheGospel
npx vitest run
```

All 56 tests pass ✅

---

## Quick Reference

| Task | How |
|---|---|
| Switch to dark mode | Click 🌙 in the top bar |
| Read in Tagalog | Click **MBB** in the top bar |
| Get a different verse | Click **🎲 Random** |
| Copy the verse | Click **📋 Copy** |
| Start a 2-min focus session | Click the toolbar icon → timer starts automatically |
| Reset the focus timer | Click **🔄 Reset Timer** in the popup |
| Add more verses | Edit `shared/verses.json` → copy to `extension/verses.json` → reload extension |
| Change icons | Replace files in `extension/icons/` → reload extension |

---

*Last updated: November 5, 2026*

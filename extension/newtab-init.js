/**
 * newtab-init.js
 * Runs synchronously before DOMContentLoaded.
 * Applies stored theme and populates the date chip.
 * Must be a separate file — MV3 CSP blocks all inline scripts.
 */

// Apply theme immediately to prevent FOUC
(function () {
  document.documentElement.dataset.theme = 'light';
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('sqts_theme', function (r) {
      if (r && r.sqts_theme) {
        document.documentElement.dataset.theme = r.sqts_theme;
      }
    });
  }
})();

// Populate date chip as soon as the element is available
document.addEventListener('DOMContentLoaded', function () {
  var chip = document.getElementById('date-chip');
  if (chip) {
    chip.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
});

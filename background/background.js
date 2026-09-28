// background/background.js
import { getReport, resetReport, deleteReport, shouldReset } from './state.js';
import { registerTrackerListener } from './trackers.js';

function registerAll() {
  registerTrackerListener(getReport);
}

browser.webNavigation.onCommitted.addListener((details) => {
  if (shouldReset(details)) {
    resetReport(details.tabId);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  deleteReport(tabId);
});

registerAll();

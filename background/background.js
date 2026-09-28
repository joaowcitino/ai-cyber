// background/background.js
import { getReport, resetReport, deleteReport, summarizeReport, shouldReset, applyMessage } from './state.js';
import { registerTrackerListener } from './trackers.js';
import { registerCookieListener } from './cookies.js';
import { registerHijackListener } from './hijack-network.js';
import { registerBounceListener, consumePendingBounce } from './bounce.js';
import { computeScore, scoreBand } from './scoring.js';
import { registerBlocklistListener } from './blocklist.js';

function registerAll() {
  registerTrackerListener(getReport);
  registerCookieListener(getReport);
  registerHijackListener(getReport);
  registerBounceListener(getReport);
  registerBlocklistListener();
}

browser.webNavigation.onCommitted.addListener((details) => {
  if (shouldReset(details)) {
    resetReport(details.tabId, { bounceTrackingDetected: consumePendingBounce(details.tabId) });
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  deleteReport(tabId);
});

registerAll();

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'get-report') {
    const summary = summarizeReport(getReport(message.tabId));
    const score = computeScore({
      ...summary,
      hijackIndicatorCount: summary.hijackIndicators.length,
    });
    return Promise.resolve({ ...summary, score, band: scoreBand(score) });
  }

  if (!sender.tab) return;
  applyMessage(getReport(sender.tab.id), message);
});

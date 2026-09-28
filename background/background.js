// background/background.js
import { getReport, resetReport, deleteReport, shouldReset } from './state.js';
import { registerTrackerListener } from './trackers.js';
import { registerCookieListener } from './cookies.js';
import { registerHijackListener } from './hijack-network.js';
import { registerBounceListener } from './bounce.js';

function registerAll() {
  registerTrackerListener(getReport);
  registerCookieListener(getReport);
  registerHijackListener(getReport);
  registerBounceListener(getReport);
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

browser.runtime.onMessage.addListener((message, sender) => {
  if (!sender.tab) return;
  const report = getReport(sender.tab.id);
  if (message.type === 'injection-failed') {
    report.injectionFailed = true;
  }
  if (message.type === 'storage-write') {
    report.thirdPartyStorageOrigins.add(message.origin);
  }
  if (message.type === 'canvas-fingerprint') {
    if (message.thirdParty) report.canvasFingerprint.thirdParty = true;
    else report.canvasFingerprint.firstParty = true;
  }
  if (message.type === 'window-tamper') {
    report.hijackIndicators.add(`window-tamper:${message.detail}`);
  }
});

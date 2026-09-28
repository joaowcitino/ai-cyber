// background/background.js
import { getReport, resetReport, deleteReport, shouldReset } from './state.js';

function registerAll() {
  // tasks seguintes adicionam chamadas register*() aqui
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

// ui/popup.js
function renderCanvas(canvasFingerprint) {
  if (canvasFingerprint.thirdParty) return '3ª parte';
  if (canvasFingerprint.firstParty) return '1ª parte';
  return 'não detectado';
}

function renderBounce(report) {
  if (report.bounceTrackingDetected) return 'detectado';
  if (report.bounceTrackingIndeterminate) return 'indeterminado';
  return 'não detectado';
}

function render(report) {
  document.getElementById('score').textContent = String(report.score);
  document.getElementById('band').textContent = report.band;
  document.getElementById('domains').textContent = String(report.thirdPartyDomainCount);
  document.getElementById('cookies').textContent = String(report.thirdPartyPersistentCookieCount);
  document.getElementById('storage').textContent = String(report.thirdPartyStorageOriginCount);
  document.getElementById('canvas').textContent = renderCanvas(report.canvasFingerprint);
  document.getElementById('bounce').textContent = renderBounce(report);
  document.getElementById('hijack').textContent = report.hijackIndicators.length
    ? report.hijackIndicators.join(', ')
    : 'nenhum';

  const warning = document.getElementById('warning');
  warning.textContent = report.injectionFailed
    ? 'Aviso: hooks de canvas/hijack não puderam ser injetados nesta página (CSP restritiva). Score parcial.'
    : '';
}

async function loadReport() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const report = await browser.runtime.sendMessage({ type: 'get-report', tabId: tab.id });
  render(report);
}

document.addEventListener('DOMContentLoaded', loadReport);
document.getElementById('options-link').addEventListener('click', (event) => {
  event.preventDefault();
  browser.runtime.openOptionsPage();
});

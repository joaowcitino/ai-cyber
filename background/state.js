// background/state.js
export function createEmptyReport() {
  return {
    thirdPartyDomains: new Set(),
    thirdPartyPersistentCookies: new Set(),
    canvasFingerprint: { firstParty: false, thirdParty: false },
    bounceTrackingDetected: false,
    bounceTrackingIndeterminate: false,
    thirdPartyStorageOrigins: new Set(),
    hijackIndicators: new Set(),
    injectionFailed: false,
  };
}

const reports = new Map();

export function getReport(tabId) {
  if (!reports.has(tabId)) {
    reports.set(tabId, createEmptyReport());
  }
  return reports.get(tabId);
}

export function resetReport(tabId) {
  const fresh = createEmptyReport();
  reports.set(tabId, fresh);
  return fresh;
}

export function deleteReport(tabId) {
  reports.delete(tabId);
}

export function summarizeReport(report) {
  return {
    thirdPartyDomainCount: report.thirdPartyDomains.size,
    thirdPartyPersistentCookieCount: report.thirdPartyPersistentCookies.size,
    canvasFingerprint: { ...report.canvasFingerprint },
    bounceTrackingDetected: report.bounceTrackingDetected,
    bounceTrackingIndeterminate: report.bounceTrackingIndeterminate,
    thirdPartyStorageOriginCount: report.thirdPartyStorageOrigins.size,
    hijackIndicators: Array.from(report.hijackIndicators),
    injectionFailed: report.injectionFailed,
  };
}

// webNavigation.onCommitted dispara para todo frame; só o frame principal
// (frameId 0) representa uma nova página — navegação SPA via history.pushState
// nunca chama onCommitted, então o report acumula entre trocas de rota
// client-side até o próximo reload completo (decisão documentada no spec).
export function shouldReset(details) {
  return details.frameId === 0;
}

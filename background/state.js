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

export function resetReport(tabId, overrides = {}) {
  const fresh = { ...createEmptyReport(), ...overrides };
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

const HIJACK_INDICATOR_CAP = 20;
const MAX_DETAIL_LENGTH = 64;

function sanitizeDetail(detail) {
  return typeof detail === 'string' ? detail.slice(0, MAX_DETAIL_LENGTH) : 'unknown';
}

// Único ponto que aplica sinais vindos de mensagens (content script/página
// injetada) ao PageReport — mensagens de página são dado não confiável
// (qualquer script da própria página pode forjar type/detail via
// postMessage), então valida e limita aqui em vez de confiar cegamente.
export function applyMessage(report, message) {
  if (message.type === 'injection-failed') {
    report.injectionFailed = true;
  }
  if (message.type === 'storage-write' && typeof message.origin === 'string' && message.origin.length > 0) {
    report.thirdPartyStorageOrigins.add(message.origin.slice(0, MAX_DETAIL_LENGTH));
  }
  if (message.type === 'canvas-fingerprint') {
    if (message.thirdParty) report.canvasFingerprint.thirdParty = true;
    else report.canvasFingerprint.firstParty = true;
  }
  if (message.type === 'window-tamper' && report.hijackIndicators.size < HIJACK_INDICATOR_CAP) {
    report.hijackIndicators.add(`window-tamper:${sanitizeDetail(message.detail)}`);
  }
  return report;
}

// background/scoring.js
const MAX_DEDUCTIONS = {
  thirdPartyDomains: 25,
  thirdPartyCookies: 20,
  storage: 10,
};

export function computeScore(summary) {
  let deductions = 0;

  deductions += Math.min(summary.thirdPartyDomainCount * 1, MAX_DEDUCTIONS.thirdPartyDomains);
  deductions += Math.min(summary.thirdPartyPersistentCookieCount * 2, MAX_DEDUCTIONS.thirdPartyCookies);

  if (summary.canvasFingerprint?.thirdParty) deductions += 15;
  else if (summary.canvasFingerprint?.firstParty) deductions += 8;

  if (summary.bounceTrackingDetected) deductions += 15;

  deductions += Math.min(summary.thirdPartyStorageOriginCount * 5, MAX_DEDUCTIONS.storage);

  if (summary.hijackIndicatorCount > 0) deductions += 15;

  return Math.max(0, 100 - deductions);
}

export function scoreBand(score) {
  if (score >= 90) return 'ótimo';
  if (score >= 70) return 'bom';
  if (score >= 40) return 'preocupante';
  return 'ruim';
}

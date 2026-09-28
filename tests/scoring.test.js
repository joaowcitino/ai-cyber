// tests/scoring.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, scoreBand } from '../background/scoring.js';

function baseSummary(overrides = {}) {
  return {
    thirdPartyDomainCount: 0,
    thirdPartyPersistentCookieCount: 0,
    canvasFingerprint: { firstParty: false, thirdParty: false },
    bounceTrackingDetected: false,
    thirdPartyStorageOriginCount: 0,
    hijackIndicatorCount: 0,
    ...overrides,
  };
}

test('página sem sinais tem score 100', () => {
  assert.equal(computeScore(baseSummary()), 100);
});

test('domínios de terceira parte deduzem 1 ponto cada, até -25', () => {
  assert.equal(computeScore(baseSummary({ thirdPartyDomainCount: 10 })), 90);
  assert.equal(computeScore(baseSummary({ thirdPartyDomainCount: 40 })), 75);
});

test('cookies persistentes de terceira parte deduzem 2 pontos cada, até -20', () => {
  assert.equal(computeScore(baseSummary({ thirdPartyPersistentCookieCount: 5 })), 90);
  assert.equal(computeScore(baseSummary({ thirdPartyPersistentCookieCount: 30 })), 80);
});

test('canvas fingerprint de terceira parte deduz 15, de primeira parte deduz 8', () => {
  assert.equal(computeScore(baseSummary({ canvasFingerprint: { firstParty: false, thirdParty: true } })), 85);
  assert.equal(computeScore(baseSummary({ canvasFingerprint: { firstParty: true, thirdParty: false } })), 92);
});

test('bounce tracking deduz 15 flat', () => {
  assert.equal(computeScore(baseSummary({ bounceTrackingDetected: true })), 85);
});

test('storage de terceira parte deduz 5 por origem, até -10', () => {
  assert.equal(computeScore(baseSummary({ thirdPartyStorageOriginCount: 1 })), 95);
  assert.equal(computeScore(baseSummary({ thirdPartyStorageOriginCount: 5 })), 90);
});

test('qualquer indicador de hijack deduz 15 flat, independente da contagem', () => {
  assert.equal(computeScore(baseSummary({ hijackIndicatorCount: 1 })), 85);
  assert.equal(computeScore(baseSummary({ hijackIndicatorCount: 5 })), 85);
});

test('score nunca fica negativo — pior caso satura em 0', () => {
  const worst = baseSummary({
    thirdPartyDomainCount: 100,
    thirdPartyPersistentCookieCount: 100,
    canvasFingerprint: { firstParty: false, thirdParty: true },
    bounceTrackingDetected: true,
    thirdPartyStorageOriginCount: 100,
    hijackIndicatorCount: 10,
  });
  assert.equal(computeScore(worst), 0);
});

test('scoreBand mapeia faixas corretamente', () => {
  assert.equal(scoreBand(95), 'ótimo');
  assert.equal(scoreBand(75), 'bom');
  assert.equal(scoreBand(50), 'preocupante');
  assert.equal(scoreBand(10), 'ruim');
});

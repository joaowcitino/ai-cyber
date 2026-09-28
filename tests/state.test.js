// tests/state.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyReport,
  getReport,
  resetReport,
  deleteReport,
  summarizeReport,
  shouldReset,
  applyMessage,
} from '../background/state.js';

test('getReport cria um PageReport vazio na primeira chamada', () => {
  const report = getReport(1);
  assert.equal(report.thirdPartyDomains.size, 0);
  assert.equal(report.injectionFailed, false);
});

test('getReport retorna a mesma instância em chamadas subsequentes', () => {
  const first = getReport(2);
  first.thirdPartyDomains.add('example.com');
  const second = getReport(2);
  assert.equal(second.thirdPartyDomains.size, 1);
});

test('resetReport substitui o report por um novo vazio', () => {
  const report = getReport(3);
  report.thirdPartyDomains.add('example.com');
  const fresh = resetReport(3);
  assert.equal(fresh.thirdPartyDomains.size, 0);
  assert.equal(getReport(3).thirdPartyDomains.size, 0);
});

test('deleteReport remove o report da aba', () => {
  getReport(4).thirdPartyDomains.add('example.com');
  deleteReport(4);
  assert.equal(getReport(4).thirdPartyDomains.size, 0);
});

test('summarizeReport converte Sets em contagens e listas', () => {
  const report = createEmptyReport();
  report.thirdPartyDomains.add('a.com');
  report.thirdPartyDomains.add('b.com');
  report.thirdPartyPersistentCookies.add('a.com|id');
  report.hijackIndicators.add('window-tamper:foo');
  const summary = summarizeReport(report);
  assert.equal(summary.thirdPartyDomainCount, 2);
  assert.equal(summary.thirdPartyPersistentCookieCount, 1);
  assert.deepEqual(summary.hijackIndicators, ['window-tamper:foo']);
});

test('shouldReset é true só para navegação do frame principal', () => {
  assert.equal(shouldReset({ frameId: 0 }), true);
  assert.equal(shouldReset({ frameId: 5 }), false);
});

test('resetReport aceita overrides para carregar sinais pendentes de antes do reset', () => {
  const fresh = resetReport(5, { bounceTrackingDetected: true });
  assert.equal(fresh.bounceTrackingDetected, true);
  assert.equal(fresh.thirdPartyDomains.size, 0);
});

test('resetReport sem overrides continua produzindo report vazio', () => {
  const fresh = resetReport(6);
  assert.equal(fresh.bounceTrackingDetected, false);
});

test('applyMessage seta injectionFailed', () => {
  const report = createEmptyReport();
  applyMessage(report, { type: 'injection-failed' });
  assert.equal(report.injectionFailed, true);
});

test('applyMessage adiciona storage-write só com origin string não vazia', () => {
  const report = createEmptyReport();
  applyMessage(report, { type: 'storage-write', origin: 'tracker.net' });
  applyMessage(report, { type: 'storage-write', origin: '' });
  applyMessage(report, { type: 'storage-write' });
  assert.deepEqual([...report.thirdPartyStorageOrigins], ['tracker.net']);
});

test('applyMessage marca canvas fingerprint por 1ª/3ª parte', () => {
  const report = createEmptyReport();
  applyMessage(report, { type: 'canvas-fingerprint', thirdParty: true });
  assert.equal(report.canvasFingerprint.thirdParty, true);
  assert.equal(report.canvasFingerprint.firstParty, false);
});

test('applyMessage trunca detail de window-tamper em 64 caracteres', () => {
  const report = createEmptyReport();
  const longDetail = 'x'.repeat(100);
  applyMessage(report, { type: 'window-tamper', detail: longDetail });
  const [entry] = [...report.hijackIndicators];
  assert.equal(entry.length, 'window-tamper:'.length + 64);
});

test('applyMessage usa "unknown" quando detail não é string', () => {
  const report = createEmptyReport();
  applyMessage(report, { type: 'window-tamper', detail: { evil: true } });
  assert.equal([...report.hijackIndicators][0], 'window-tamper:unknown');
});

test('applyMessage limita hijackIndicators a 20 entradas (proteção contra spam)', () => {
  const report = createEmptyReport();
  for (let i = 0; i < 25; i++) {
    applyMessage(report, { type: 'window-tamper', detail: `key${i}` });
  }
  assert.equal(report.hijackIndicators.size, 20);
});

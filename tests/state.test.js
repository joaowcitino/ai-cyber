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

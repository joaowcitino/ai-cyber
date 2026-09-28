// tests/bounce.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractTrackingParams,
  detectBounce,
  hasInitiator,
  hasDistinctRegistrableDomains,
  markPendingMainFrameBounce,
  consumePendingBounce,
} from '../background/bounce.js';

test('extractTrackingParams ignora valores curtos (não-IDs)', () => {
  const params = extractTrackingParams('https://x.com/?ok=1&id=abcdef1234567890');
  assert.deepEqual(Object.keys(params), ['id']);
});

test('detectBounce identifica ID compartilhado entre saltos do redirect', () => {
  const chain = [
    { url: 'https://a.com/?uid=abcdef1234567890' },
    { url: 'https://tracker.net/sync?uid=abcdef1234567890' },
    { url: 'https://a.com/landing?uid=abcdef1234567890' },
  ];
  assert.equal(detectBounce(chain).detected, true);
});

test('detectBounce não detecta sem parâmetro compartilhado', () => {
  const chain = [
    { url: 'https://a.com/?x=1' },
    { url: 'https://b.com/?y=2' },
  ];
  assert.equal(detectBounce(chain).detected, false);
});

test('detectBounce não detecta com um único salto', () => {
  assert.equal(detectBounce([{ url: 'https://a.com/' }]).detected, false);
});

test('hasInitiator distingue presença de initiator/originUrl', () => {
  assert.equal(hasInitiator({}), false);
  assert.equal(hasInitiator({ initiator: 'https://a.com' }), true);
  assert.equal(hasInitiator({ originUrl: 'https://a.com' }), true);
});

test('detectBounce não detecta parâmetro repetido dentro do mesmo domínio (falso positivo de UTM)', () => {
  const chain = [
    { url: 'https://shop.com/p?utm_campaign=newsletter123' },
    { url: 'https://shop.com/checkout?utm_campaign=newsletter123' },
  ];
  assert.equal(detectBounce(chain).detected, false);
});

test('hasDistinctRegistrableDomains exige 2+ domínios registráveis distintos na cadeia', () => {
  assert.equal(hasDistinctRegistrableDomains([{ url: 'https://a.com/x' }, { url: 'https://sub.a.com/y' }]), false);
  assert.equal(hasDistinctRegistrableDomains([{ url: 'https://a.com/x' }, { url: 'https://tracker.net/y' }]), true);
});

test('markPendingMainFrameBounce + consumePendingBounce é one-shot por aba', () => {
  assert.equal(consumePendingBounce(99), false);
  markPendingMainFrameBounce(99);
  assert.equal(consumePendingBounce(99), true);
  assert.equal(consumePendingBounce(99), false);
});

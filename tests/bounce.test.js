// tests/bounce.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTrackingParams, detectBounce, hasInitiator } from '../background/bounce.js';

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

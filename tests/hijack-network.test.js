// tests/hijack-network.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isWebSocketRequest, detectExcessivePolling } from '../background/hijack-network.js';

test('isWebSocketRequest identifica ws:// e wss://', () => {
  assert.equal(isWebSocketRequest('wss://example.com/socket'), true);
  assert.equal(isWebSocketRequest('ws://example.com/socket'), true);
  assert.equal(isWebSocketRequest('https://example.com/api'), false);
});

test('detectExcessivePolling é true acima do limiar na janela', () => {
  const now = 100000;
  const timestamps = Array.from({ length: 8 }, (_, i) => now - i * 500);
  assert.equal(detectExcessivePolling(timestamps, 10000, 8), true);
});

test('detectExcessivePolling é false abaixo do limiar', () => {
  const now = 100000;
  const timestamps = [now - 9000, now];
  assert.equal(detectExcessivePolling(timestamps, 10000, 8), false);
});

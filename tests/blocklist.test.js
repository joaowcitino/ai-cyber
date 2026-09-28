// tests/blocklist.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesBlocklist } from '../background/blocklist.js';

test('bloqueia domínio exato', () => {
  assert.equal(matchesBlocklist('https://tracker.net/x.js', ['tracker.net']), true);
});

test('bloqueia subdomínio de domínio na lista', () => {
  assert.equal(matchesBlocklist('https://ads.tracker.net/x.js', ['tracker.net']), true);
});

test('não bloqueia domínio fora da lista', () => {
  assert.equal(matchesBlocklist('https://example.com/x.js', ['tracker.net']), false);
});

test('não bloqueia domínio que só compartilha sufixo textual', () => {
  assert.equal(matchesBlocklist('https://nottracker.net/x.js', ['tracker.net']), false);
});

test('URL inválida não bloqueia (fail-open)', () => {
  assert.equal(matchesBlocklist('not-a-url', ['tracker.net']), false);
});

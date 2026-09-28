// tests/cookies.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyCookie } from '../background/cookies.js';

test('cookie de mesmo domínio registrável é first-party', () => {
  const result = classifyCookie({ domain: '.example.com' }, 'www.example.com');
  assert.equal(result.ownership, 'first');
});

test('cookie de domínio diferente é third-party', () => {
  const result = classifyCookie({ domain: 'ads.tracker.net' }, 'www.example.com');
  assert.equal(result.ownership, 'third');
});

test('cookie sem expirationDate é sessão', () => {
  const result = classifyCookie({ domain: 'example.com' }, 'example.com');
  assert.equal(result.lifetime, 'session');
});

test('cookie com expirationDate é persistente', () => {
  const result = classifyCookie({ domain: 'example.com', expirationDate: 1999999999 }, 'example.com');
  assert.equal(result.lifetime, 'persistent');
});

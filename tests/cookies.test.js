// tests/cookies.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyCookie, parseSetCookieHeader, extractSetCookieHeaders } from '../background/cookies.js';

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

test('parseSetCookieHeader extrai nome, domínio explícito e expiração via Max-Age', () => {
  const cookie = parseSetCookieHeader('id=abc123; Domain=tracker.net; Max-Age=3600; Path=/', 'ads.tracker.net');
  assert.equal(cookie.name, 'id');
  assert.equal(cookie.domain, 'tracker.net');
  assert.ok(cookie.expirationDate > Date.now() / 1000);
});

test('parseSetCookieHeader usa o host da requisição quando não há Domain (host-only cookie)', () => {
  const cookie = parseSetCookieHeader('sid=xyz; Path=/', 'ads.tracker.net');
  assert.equal(cookie.domain, 'ads.tracker.net');
});

test('parseSetCookieHeader sem Max-Age/Expires é cookie de sessão (expirationDate indefinido)', () => {
  const cookie = parseSetCookieHeader('sid=xyz; Path=/', 'ads.tracker.net');
  assert.equal(cookie.expirationDate, undefined);
});

test('extractSetCookieHeaders filtra só os headers Set-Cookie, case-insensitive', () => {
  const headers = extractSetCookieHeaders([
    { name: 'Content-Type', value: 'text/html' },
    { name: 'Set-Cookie', value: 'a=1' },
    { name: 'set-cookie', value: 'b=2' },
  ]);
  assert.deepEqual(headers, ['a=1', 'b=2']);
});

test('extractSetCookieHeaders lida com responseHeaders ausente', () => {
  assert.deepEqual(extractSetCookieHeaders(undefined), []);
});

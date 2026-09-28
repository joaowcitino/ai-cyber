// tests/trackers.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRegistrableDomain, isThirdParty } from '../background/trackers.js';

test('getRegistrableDomain extrai domínio + TLD simples', () => {
  assert.equal(getRegistrableDomain('www.example.com'), 'example.com');
  assert.equal(getRegistrableDomain('ads.tracker.example.com'), 'example.com');
});

test('getRegistrableDomain trata ccSLDs conhecidos (ex. com.br)', () => {
  assert.equal(getRegistrableDomain('www.insper.com.br'), 'insper.com.br');
  assert.equal(getRegistrableDomain('sub.loja.com.br'), 'loja.com.br');
});

test('isThirdParty compara domínio registrável, não hostname completo', () => {
  assert.equal(isThirdParty('https://cdn.example.com/x.js', 'https://www.example.com/'), false);
  assert.equal(isThirdParty('https://ads.tracker.net/x.js', 'https://www.example.com/'), true);
});

test('isThirdParty retorna false sem initiator (não penaliza sem evidência)', () => {
  assert.equal(isThirdParty('https://example.com/x.js', ''), false);
});

// tests/options.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeBlocklist } from '../ui/options.js';

test('sanitizeBlocklist normaliza para minúsculas e remove espaços', () => {
  assert.deepEqual(sanitizeBlocklist(' Tracker.NET \n example.com'), ['tracker.net', 'example.com']);
});

test('sanitizeBlocklist descarta linhas vazias', () => {
  assert.deepEqual(sanitizeBlocklist('tracker.net\n\n\nexample.com'), ['tracker.net', 'example.com']);
});

test('sanitizeBlocklist descarta entradas que não parecem domínio', () => {
  assert.deepEqual(sanitizeBlocklist('tracker.net\nnot a domain\nexample.com'), ['tracker.net', 'example.com']);
});

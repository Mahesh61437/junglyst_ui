import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePageParam, withPageParam } from './pageParam.js';

test('parsePageParam reads valid page numbers', () => {
  assert.equal(parsePageParam('3'), 3);
  assert.equal(parsePageParam('42'), 42);
});

test('parsePageParam falls back to page 1 for missing or invalid values', () => {
  for (const value of [null, undefined, '', '0', '-2', 'abc', '1']) {
    assert.equal(parsePageParam(value), 1, `value ${value}`);
  }
});

test('withPageParam sets the page and keeps other params', () => {
  const next = withPageParam(new URLSearchParams('q=moss'), 4);
  assert.equal(next.get('page'), '4');
  assert.equal(next.get('q'), 'moss');
});

test('withPageParam removes the param for page 1', () => {
  const next = withPageParam(new URLSearchParams('page=5&q=moss'), 1);
  assert.equal(next.has('page'), false);
  assert.equal(next.get('q'), 'moss');
});

test('withPageParam does not mutate the input', () => {
  const original = new URLSearchParams('page=2');
  withPageParam(original, 7);
  assert.equal(original.get('page'), '2');
});

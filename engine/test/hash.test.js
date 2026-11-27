import test from 'node:test';
import assert from 'node:assert';
import DS from '../hash.js';

test('bookId: same bytes give the same id, different bytes or size give another', () => {
  const a = new Uint8Array([1, 2, 3, 4, 5]);
  assert.strictEqual(DS.bookId(a), DS.bookId(new Uint8Array([1, 2, 3, 4, 5])));
  assert.notStrictEqual(DS.bookId(a), DS.bookId(new Uint8Array([1, 2, 3, 4, 6])));
  assert.notStrictEqual(DS.bookId(a), DS.bookId(new Uint8Array([1, 2, 3, 4, 5, 0])));
  assert.match(DS.bookId(a), /^[0-9a-f]{8}-\d+$/);
});

test('bookId: a large file is hashed from its first and last 512 KB plus its size', () => {
  const big = new Uint8Array(2_000_000).fill(7);
  const mid = new Uint8Array(big); mid[1_000_000] = 9; // changes only the middle: same id by design
  assert.strictEqual(DS.bookId(big), DS.bookId(mid));
  const end = new Uint8Array(big); end[1_999_999] = 9;
  assert.notStrictEqual(DS.bookId(big), DS.bookId(end));
});

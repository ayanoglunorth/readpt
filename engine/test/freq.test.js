import test from 'node:test';
import assert from 'node:assert';
import '../words-en.js';
import '../freq-en.js';
import DS from '../vocab.js';

test('freqRank orders by subtitle frequency and maps inflected forms', () => {
  assert.ok(DS.freqRank('time') < DS.freqRank('abandon'));
  assert.ok(DS.freqRank('abandon') < DS.freqRank('abolish'));
  assert.strictEqual(DS.freqRank('stopped'), DS.freqRank('stop'));
  assert.strictEqual(DS.freqRank('xyzzy'), null);
});

test('FREQ_EN: 5000..9000 unique headwords', () => {
  const w = DS.FREQ_EN.split(' ');
  assert.ok(w.length >= 5000 && w.length <= 9000, String(w.length));
  assert.strictEqual(new Set(w).size, w.length);
  assert.ok(w.every(x => DS.headword(x)));
  assert.ok(DS.freqRank('thing') < 300); // "thing" is its own entry, not folded into "the"
});

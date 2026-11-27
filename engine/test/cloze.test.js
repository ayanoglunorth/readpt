import test from 'node:test';
import assert from 'node:assert';
import '../words-en.js';
import '../freq-en.js';
import DS from '../vocab.js';
import '../ability.js';
import '../cloze-en.js';

test('cloze bank: 30 items, 6 per level A2..C2, well formed', () => {
  const b = DS.CLOZE_EN;
  assert.strictEqual(b.length, 30);
  for (const l of ['A2', 'B1', 'B2', 'C1', 'C2']) assert.strictEqual(b.filter(c => c.level === l).length, 6, l);
  for (const c of b) {
    assert.strictEqual(c.q.split('___').length, 2, c.q);
    assert.strictEqual(c.options.length, 4, c.q);
    assert.strictEqual(new Set(c.options).size, 4, c.q);
    assert.ok(Number.isInteger(c.answer) && c.answer >= 0 && c.answer < 4, c.q);
  }
  assert.strictEqual(new Set(b.map(c => c.q)).size, 30);
  assert.ok(new Set(b.map(c => c.answer)).size >= 3); // the right answer is not always in the same slot
});

test('nextCloze: never repeats, ends with null, harder for stronger learners', () => {
  const asked = new Set();
  const first = DS.nextCloze(DS.abilityNew('A2'), DS.CLOZE_EN, asked, () => 0);
  const hard = DS.nextCloze(DS.abilityNew('C2'), DS.CLOZE_EN, asked, () => 0);
  assert.ok(DS.LEVELS.indexOf(hard.level) > DS.LEVELS.indexOf(first.level));
  for (let i = 0; i < 30; i++) {
    const c = DS.nextCloze(DS.abilityNew('B1'), DS.CLOZE_EN, asked, () => 0.5);
    assert.ok(c && !asked.has(c.index));
    asked.add(c.index);
  }
  assert.strictEqual(DS.nextCloze(DS.abilityNew('B1'), DS.CLOZE_EN, asked), null);
});

test('cloze bank tests structure, not rare words: every word in a question is common (subtitle rank <= 4500)', () => {
  const rare = [];
  for (const c of DS.CLOZE_EN) {
    for (const w of `${c.q} ${c.options.join(' ')}`.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)) {
      if (w.includes("'") || w === '___' || w.length < 3) continue;
      const r = DS.freqRank(w);
      if (!r || r > 4500) rare.push(`${w}:${r}`);
    }
  }
  assert.deepStrictEqual(rare, []);
});

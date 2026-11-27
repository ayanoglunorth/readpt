import test from 'node:test';
import assert from 'node:assert';
import '../words-en.js';
import '../freq-en.js';
import DS from '../vocab.js';
import '../ability.js';
import '../cloze-en.js';
import '../placement.js';

const mulberry32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const sig = z => 1 / (1 + Math.exp(-z));

// Plays a whole session; `say(item)` gives the answer (boolean for words and non-words, option index for cloze).
function play(seed, say) {
  const s = DS.placementStart(mulberry32(seed)), seen = [];
  while (s.phase !== 'done') { seen.push(s.current); s.answer(say(s.current)); }
  return { s, seen };
}

test('yes to everything: low level, at most 50 word-phase questions plus 15 cloze', () => {
  const { s, seen } = play(1, it => (it.kind === 'cloze' ? 0 : true));
  assert.ok(['A1', 'A2'].includes(s.level));
  assert.ok(seen.filter(i => i.kind !== 'cloze').length <= 50);
  assert.strictEqual(seen.filter(i => i.kind === 'cloze').length, 15);
});

test('no to everything: A1', () => {
  const { s } = play(2, it => (it.kind === 'cloze' ? (it.answer + 1) % 4 : false));
  assert.strictEqual(s.level, 'A1');
});

test('honest B1 learner never lands on C1+ and mostly on A2..B2', () => {
  let ok = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const rand = mulberry32(seed + 1000);
    const { s } = play(seed, it => {
      if (it.kind === 'fake') return rand() < 0.05;
      if (it.kind === 'word') return rand() < 0.05 + 0.9 * sig((Math.log(2400) - Math.log(it.rank)) / 0.6);
      const right = rand() < 0.25 + 0.7 * sig((Math.log(2400) - Math.log(DS.LEVEL_MID[it.level])) / 0.7);
      return right ? it.answer : (it.answer + 1) % 4;
    });
    assert.ok(DS.LEVELS.indexOf(s.level) <= 3, s.level);
    if (['A2', 'B1', 'B2'].includes(s.level)) ok++;
  }
  assert.ok(ok >= 27, `${ok}/30`);
});

test('non-words are every sixth word-phase item, never real, never repeated; words never repeat', () => {
  const { seen } = play(3, it => (it.kind === 'cloze' ? 0 : it.kind === 'word'));
  const words = seen.filter(i => i.kind !== 'cloze');
  words.forEach((it, i) => assert.strictEqual(it.kind === 'fake', i % 6 === 5, String(i)));
  const fakes = words.filter(i => i.kind === 'fake');
  assert.ok(fakes.every(f => !DS.headword(f.word)));
  assert.strictEqual(new Set(words.map(w => w.word)).size, words.length);
});

test('answering after done changes nothing; different seeds start differently', () => {
  const { s } = play(4, () => true);
  const level = s.level;
  s.answer(true);
  assert.strictEqual(s.level, level);
  assert.strictEqual(s.current, null);
  const firsts = new Set([5, 6, 7, 8, 9].map(seed => DS.placementStart(mulberry32(seed)).current.word));
  assert.ok(firsts.size > 1);
});

test('back: returns to the previous question and forgets that answer, across phases too', () => {
  const s = DS.placementStart(mulberry32(11));
  assert.strictEqual(s.canBack(), false);
  s.back(); // nothing to go back to
  const first = s.current;
  s.answer(true);
  const second = s.current;
  s.answer(false);
  assert.strictEqual(s.n, 2);
  assert.strictEqual(s.canBack(), true);
  s.back();
  assert.strictEqual(s.current, second);
  assert.strictEqual(s.n, 1);
  s.back();
  assert.strictEqual(s.current, first);
  assert.strictEqual(s.n, 0);
  assert.strictEqual(s.canBack(), false);
  // a different answer after going back gives a legitimate run to the end
  while (s.phase === 'words') s.answer(false);
  assert.strictEqual(s.phase, 'cloze');
  const firstCloze = s.current;
  s.back();
  assert.strictEqual(s.phase, 'words');
  assert.notStrictEqual(s.current.kind, 'cloze');
  s.answer(false);
  assert.strictEqual(s.current.kind, 'cloze');
  while (s.phase !== 'done') s.answer(0);
  assert.ok(s.level);
  assert.ok(firstCloze);
});

test('cloze: -1 skips the question; skipping everything cannot beat answering them', () => {
  const words = it => it.kind === 'word' && it.rank < 2400;
  const lvl = cloze => play(21, it => (it.kind === 'cloze' ? cloze(it) : words(it) || false)).s.level;
  const skipAll = lvl(() => -1), rightAll = lvl(it => it.answer);
  assert.ok(DS.LEVELS.indexOf(skipAll) <= DS.LEVELS.indexOf(rightAll));
});

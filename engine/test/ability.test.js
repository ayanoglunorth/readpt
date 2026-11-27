import test from 'node:test';
import assert from 'node:assert';
import '../words-en.js';
import '../freq-en.js';
import DS from '../vocab.js';
import '../ability.js';

const mulberry32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const sig = z => 1 / (1 + Math.exp(-z));
const CUTS = [800, 1800, 3000, 4500, 6500];
const idx = theta => CUTS.filter(c => theta >= c).length;
const pool = DS.placementPool();

// A simulated learner who knows words up to rank theta; g = share of unknown/non-words they claim to know anyway.
function run(theta, g, seed, yesAll) {
  const rand = mulberry32(seed);
  let s = DS.abilityNew();
  const asked = new Set();
  let n = 0, k = 0;
  while (!DS.abilityDone(s, n)) {
    if (k++ % 6 === 5) { s = DS.abilityUpdate(s, { kind: 'fake' }, yesAll || rand() < g); continue; }
    const it = DS.nextWord(s, pool, asked, rand);
    asked.add(it.word);
    const p = g + (1 - g - 0.05) * sig((Math.log(theta) - Math.log(it.rank)) / 0.6);
    s = DS.abilityUpdate(s, { kind: 'word', rank: it.rank }, yesAll || rand() < p);
    n++;
  }
  return { s, n };
}

test('placementPool: sorted by frequency, ranks match freqRank, large enough', () => {
  assert.ok(pool.length >= 1500);
  assert.ok(pool.every((p, i) => p.rank === DS.freqRank(p.word) && (i === 0 || pool[i - 1].rank <= p.rank)));
});

test('honest learners land within one level of their true level and the test stops by 50 words', () => {
  for (const theta of [600, 1500, 2400, 3700, 5500, 8000]) {
    let ok = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { s, n } = run(theta, 0.05, seed);
      assert.ok(n <= 50);
      if (Math.abs(DS.LEVELS.indexOf(DS.abilityLevel(s)) - idx(theta)) <= 1) ok++;
    }
    assert.ok(ok >= 33, `theta ${theta}: ${ok}/40`);
  }
});

test('an overclaiming B1 learner is not placed above B2 on average', () => {
  let sum = 0;
  for (let seed = 1; seed <= 40; seed++) sum += DS.LEVELS.indexOf(DS.abilityLevel(run(2400, 0.3, seed).s)) - idx(2400);
  assert.ok(sum / 40 <= 0.5, String(sum / 40));
});

test('yes to everything lands low, no to everything lands on A1', () => {
  assert.ok(DS.LEVELS.indexOf(DS.abilityLevel(run(0, 0, 1, true).s)) <= 1);
  let s = DS.abilityNew();
  for (let i = 0; i < 50; i++) s = DS.abilityUpdate(s, { kind: 'word', rank: 500 + i * 100 }, false);
  assert.strictEqual(DS.abilityLevel(s), 'A1');
});

test('abilityGuess grows with non-word yeses and is capped at 0.6', () => {
  let s = DS.abilityNew();
  const g0 = DS.abilityGuess(s);
  s = DS.abilityUpdate(s, { kind: 'fake' }, true);
  assert.ok(DS.abilityGuess(s) > g0);
  for (let i = 0; i < 100; i++) s = DS.abilityUpdate(s, { kind: 'fake' }, true);
  assert.ok(DS.abilityGuess(s) <= 0.6);
});

test('abilityNew(level) starts near that level; quantiles are ordered', () => {
  const s = DS.abilityNew('B1');
  assert.ok(['A2', 'B1', 'B2'].includes(DS.abilityLevel(s)));
  assert.ok(DS.abilityQuantile(s, 0.25) < DS.abilityQuantile(s, 0.5) && DS.abilityQuantile(s, 0.5) < DS.abilityQuantile(s, 0.75));
});

test('a cloze miss at a hard level and a hit at an easy one move the estimate the right way', () => {
  const lo = DS.abilityUpdate(DS.abilityNew(), { kind: 'cloze', rank: 3700 }, false);
  const hi = DS.abilityUpdate(DS.abilityNew(), { kind: 'cloze', rank: 3700 }, true);
  assert.ok(DS.abilityQuantile(lo, 0.5) < DS.abilityQuantile(hi, 0.5));
});

test('abilityAfterQuiz: yeses on hard words raise the estimate, nos on words above the level only nudge it down, unranked words are ignored', () => {
  const hard = ['abolish', 'abandon', 'accuse', 'affect', 'bellow', 'bloody'].map(word => ({ word, known: true }));
  const s = DS.abilityNew('B1');
  assert.ok(DS.abilityQuantile(DS.abilityAfterQuiz(s, hard), 0.5) > DS.abilityQuantile(s, 0.5));
  const nos = ['abolish', 'bellow'].map(word => ({ word, known: false }));
  const m0 = DS.abilityQuantile(s, 0.5), m1 = DS.abilityQuantile(DS.abilityAfterQuiz(s, nos), 0.5);
  assert.ok(m1 <= m0 && m1 > 0.6 * m0);
  assert.deepStrictEqual(DS.abilityAfterQuiz(s, [{ word: 'xyzzy', known: true }]).post, s.post);
  assert.deepStrictEqual(DS.abilityAfterQuiz(s, []).post, s.post);
});

test('skipping a cloze item says "does not know" more firmly than a wrong guess', () => {
  const s = DS.abilityNew('C1');
  const wrong = DS.abilityUpdate(s, { kind: 'cloze', rank: 3700 }, false);
  const skipped = DS.abilityUpdate(s, { kind: 'cloze', rank: 3700, skip: true }, false);
  const mean = st => st.post.reduce((a, p, i) => a + p * i, 0); // grid index; the quantiles are too coarse to tell these apart
  assert.ok(mean(skipped) < mean(wrong));
});

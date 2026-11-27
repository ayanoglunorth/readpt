import test from 'node:test';
import assert from 'node:assert';
import '../words-en.js';
import DS from '../vocab.js';

const L = DS.LEVELS;

test('word list covers all six levels', () => {
  for (const l of L) assert.ok(DS.WORDS_EN[l].split(' ').length > 500, l);
});

test('inflected forms map to their headword', () => {
  const h = w => DS.headword(w)?.word;
  assert.strictEqual(h('running'), 'run');
  assert.strictEqual(h('ran'), 'run');
  assert.strictEqual(h('Went'), 'go');
  assert.strictEqual(h('bought'), 'buy');
  assert.strictEqual(h('cities'), 'city');
  assert.strictEqual(h('boxes'), 'box');
  assert.strictEqual(h('stopped'), 'stop');
  assert.strictEqual(h('making'), 'make');
  assert.strictEqual(h('children'), 'child');
});

test('unknown words and bad stems are ignored', () => {
  assert.strictEqual(DS.headword('xyzzy'), null);
  assert.strictEqual(DS.headword('Zorblax'), null);
  assert.strictEqual(DS.headword("it's")?.word, undefined);
  assert.deepStrictEqual(DS.headword('a'), DS.headword('A'));
});

test('headword carries the lowest level rank', () => {
  assert.strictEqual(DS.headword('run').rank, 0);
  assert.ok(DS.headword('abandon').rank >= 2);
});

test('spoken forms the CEFR lists lack are quizzable', () => {
  for (const w of ['gonna', 'wanna', "ain't", "y'all"]) assert.ok(DS.headword(w), w);
  assert.deepStrictEqual(DS.pickQuizWords(["I'm gonna do it, y'all."], 0, {}).map(w => w.word), ['gonna', "y'all"]);
});

const cue = text => text;

test('pickQuizWords: only above level, unseen, most frequent first', () => {
  const texts = [cue('He wants to abandon the plan. Abandon it!'), cue('A cat and a dog.'), cue('We abandoned everything')];
  const above = DS.headword('abandon').rank;
  const got = DS.pickQuizWords(texts, above - 1, {}, 10);
  assert.ok(got.length > 0);
  assert.strictEqual(got[0].word, 'abandon');
  assert.strictEqual(got[0].count, 3);
  assert.ok(got.every(w => w.rank > above - 1));
  assert.ok(!got.some(w => w.word === 'cat'));
  assert.ok(!DS.pickQuizWords(texts, above, {}, 10).some(w => w.word === 'abandon'));
  assert.ok(!DS.pickQuizWords(texts, above - 1, { abandon: 'l' }, 10).some(w => w.word === 'abandon'));
});

test('pickQuizWords respects n and prefers the next two levels', () => {
  const own = r => DS.WORDS_EN[L[r]].split(' ').filter(w => DS.headword(w).word === w && DS.headword(w).rank === r).slice(0, 5);
  const b1 = own(2), c2 = own(5);
  const texts = [[...c2, ...c2, ...c2, ...b1].join(' ')];
  const got = DS.pickQuizWords(texts, 1, {}, 5); // level A2: B1 is +1, C2 is +4
  assert.strictEqual(got.length, 5);
  assert.ok(got.every(w => w.rank === 2));
});

test('pickQuizWords returns fewer than n when the video has fewer candidates', () => {
  const got = DS.pickQuizWords(['They abandon, abolish, accuse and affect it.'], 1, {}, 20);
  assert.ok(got.length >= 3 && got.length < 20);
});

test('limitedFetcher: at most `limit` in flight, one fetch per key, urgent first, failures retried', async () => {
  let live = 0, peak = 0;
  const started = [];
  const gates = new Map();
  const fetchFn = key => {
    started.push(key);
    live++; peak = Math.max(peak, live);
    return new Promise((res, rej) => gates.set(key, { res: v => { live--; res(v); }, rej: e => { live--; rej(e); } }));
  };
  const f = DS.limitedFetcher(fetchFn, 3);
  const ps = ['a', 'b', 'c', 'd', 'e', 'f'].map(k => f.get(k));
  assert.strictEqual(f.get('a'), ps[0]); // same key, same promise
  const tick = () => new Promise(r => setImmediate(r));
  await tick();
  assert.deepStrictEqual(started, ['a', 'b', 'c']);
  const urgent = f.get('z', true);
  gates.get('a').res('A');
  await tick();
  assert.deepStrictEqual(started, ['a', 'b', 'c', 'z']); // z jumped ahead of d, e, f
  for (const k of ['b', 'c', 'z']) gates.get(k).res(k.toUpperCase());
  await tick();
  for (const k of ['d', 'e', 'f']) gates.get(k).res(k.toUpperCase());
  assert.deepStrictEqual(await Promise.all(ps), ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.strictEqual(await urgent, 'Z');
  assert.ok(peak <= 3);
  const g = DS.limitedFetcher(() => Promise.reject(new Error('429')), 3);
  await assert.rejects(g.get('x'));
  await assert.rejects(g.get('x')); // not cached: asked again, not a stale rejection
});

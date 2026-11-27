import test from 'node:test';
import assert from 'node:assert';
import DS from '../review.js';

const DAY = 864e5, NOW = 1e12;
const W = (word, translation, extra = {}) => ({ word, translation, from: 'en', to: 'tr', context: '', at: Math.random(), ...extra });

test('dueWords: no due field means due now; future ones wait; oldest first; capped', () => {
  const ws = [W('a', 'x'), W('b', 'y', { due: NOW + DAY }), W('c', 'z', { due: NOW - 5 }), W('d', 'q', { due: NOW - 50 })];
  assert.deepStrictEqual(DS.dueWords(ws, NOW).map(w => w.word), ['a', 'd', 'c']);
  assert.strictEqual(DS.dueWords(ws, NOW, 2).length, 2);
});

test('gradeWord: right moves up and waits 3/7/21 days, wrong goes to box 1 for a day', () => {
  let w = DS.gradeWord(W('a', 'x'), true, NOW);
  assert.deepStrictEqual([w.box, w.due], [2, NOW + 3 * DAY]);
  w = DS.gradeWord(w, true, NOW); assert.deepStrictEqual([w.box, w.due], [3, NOW + 7 * DAY]);
  w = DS.gradeWord(w, true, NOW); w = DS.gradeWord(w, true, NOW);
  assert.deepStrictEqual([w.box, w.due], [4, NOW + 21 * DAY]); // box 4 stays
  w = DS.gradeWord(w, false, NOW);
  assert.deepStrictEqual([w.box, w.due], [1, NOW + DAY]);
});

test('blankContext: whole word only, case-insensitive, null when absent', () => {
  assert.strictEqual(DS.blankContext(W('run', 'koş', { context: 'They Run fast.' })), 'They ____ fast.');
  assert.strictEqual(DS.blankContext(W('run', 'koş', { context: 'A runner.' })), null);
  assert.strictEqual(DS.blankContext(W('run', 'koş', { context: '' })), null);
  assert.strictEqual(DS.blankContext(W('c++', 'x', { context: 'I like c++ a lot' })), 'I like ____ a lot');
});

const five = ['a1', 'b2', 'c3', 'd4', 'e5'].map((x, i) => W(x, 'tr' + i, { context: i === 0 ? 'say a1 now' : '' }));

test('makeQuestion: choice, reverse and (with a saved sentence) cloze, each with 4 distinct options', () => {
  const c = DS.makeQuestion(five[1], five, () => 0);
  assert.strictEqual(c.type, 'choice');
  assert.strictEqual(c.options.length, 4);
  assert.ok(c.options.includes(c.answer) && new Set(c.options).size === 4);
  const r = DS.makeQuestion(five[1], five, () => 0.5);
  assert.deepStrictEqual([r.type, r.prompt, r.answer], ['reverse', 'tr1', 'b2']);
  const k = DS.makeQuestion(five[0], five, () => 0.99);
  assert.deepStrictEqual([k.type, k.prompt, k.answer], ['cloze', 'say ____ now', 'a1']);
});

test('makeQuestion: too few words gives no question; English tops reverse up from the CEFR lists', () => {
  assert.strictEqual(DS.makeQuestion(five[0], five.slice(0, 2), () => 0), null);
  DS.WORDS_EN = { A2: 'apple bread chair dream eagle' };
  const r = DS.makeQuestion(five[1], five.slice(0, 2), () => 0);
  assert.strictEqual(r.type, 'reverse');
  assert.strictEqual(r.options.length, 4);
  assert.ok(r.options.includes('b2'));
  const de = [W('a', 'x', { from: 'de' }), W('b', 'y', { from: 'de' })];
  assert.strictEqual(DS.makeQuestion(de[0], de, () => 0), null); // no lists for German
  delete DS.WORDS_EN;
});

test('makeQuestion: distractors never come from another language pair', () => {
  const ws = [W('a', 'x'), ...['b', 'c', 'd', 'e'].map(w => W(w, 'y' + w, { from: 'de' }))];
  assert.strictEqual(DS.makeQuestion(ws[0], ws, () => 0), null);
});

test('makeSession: due words first; with nothing due it is free practice; words without material are left out', () => {
  const s = DS.makeSession(five, NOW);
  assert.strictEqual(s.length, 5);
  assert.ok(s.every(i => !i.free && i.q));
  const later = five.map(w => ({ ...w, due: NOW + DAY }));
  const f = DS.makeSession(later, NOW);
  assert.deepStrictEqual([f.length, f.every(i => i.free)], [5, true]);
  assert.deepStrictEqual(DS.makeSession([W('a', 'x'), W('b', 'y')], NOW), []);
});

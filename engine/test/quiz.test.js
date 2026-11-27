import test from 'node:test';
import assert from 'node:assert';
import DS from '../quiz.js';

const W = (...ws) => ws.map((word, i) => ({ word, rank: 3, count: ws.length - i }));

test('quiz walks the words in order and keeps answers', () => {
  const q = DS.quizStart(W('a1', 'b1', 'c1'));
  assert.strictEqual(q.current.word, 'a1');
  q.answer(true);
  assert.strictEqual(q.current.word, 'b1');
  q.answer(false);
  q.answer(false);
  assert.strictEqual(q.done, true);
  assert.strictEqual(q.current, null);
  assert.deepStrictEqual(q.summary(), { known: ['a1'], unknown: ['b1', 'c1'] });
});

test('skip ends the quiz at once; unanswered words are left out of the summary and the vocab', () => {
  const q = DS.quizStart(W('a1', 'b1', 'c1'));
  q.answer(false);
  q.skip();
  assert.strictEqual(q.done, true);
  assert.deepStrictEqual(q.summary(), { known: [], unknown: ['a1'] });
  assert.deepStrictEqual(DS.quizVocab(q.summary()), { a1: 'l' });
});

test('quizVocab marks known words k and unknown words l', () => {
  assert.deepStrictEqual(DS.quizVocab({ known: ['x'], unknown: ['y', 'z'] }), { x: 'k', y: 'l', z: 'l' });
});

test('fewer than QUIZ_MIN candidates means no quiz', () => {
  assert.strictEqual(DS.quizStart(W('a1', 'b1')), null);
  assert.ok(DS.quizStart(W('a1', 'b1', 'c1')));
});

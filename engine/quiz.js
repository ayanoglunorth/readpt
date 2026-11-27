// One pre-reading quiz: a card per word (know / don't know), then a summary. Pure state machine; the screen shows `current`.
// Needs vocab.js for DS.QUIZ_MIN.
import { DS } from './ds.js';
import './vocab.js';

// words: [{word, rank, count}] from DS.pickBookWords. null when there are too few to be worth a quiz.
DS.quizStart = words => {
  if (words.length < DS.QUIZ_MIN) return null;
  const known = [], unknown = [];
  const q = {
    total: words.length, done: false, current: words[0],
    answer(isKnown) {
      if (q.done) return;
      (isKnown ? known : unknown).push(q.current.word);
      const next = words[known.length + unknown.length];
      q.current = next || null;
      q.done = !next;
    },
    skip() { q.done = true; q.current = null; },
    summary: () => ({ known: [...known], unknown: [...unknown] }),
  };
  return q;
};

// The `vocab` entries a finished quiz writes: 'k' knew it, 'l' learning.
DS.quizVocab = ({ known, unknown }) => Object.fromEntries([...known.map(w => [w, 'k']), ...unknown.map(w => [w, 'l'])]);

export default DS;

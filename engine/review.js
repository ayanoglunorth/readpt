// Practice for the saved words: Leitner boxes with due dates, and question building. Pure; runs in Node too.
// A saved word is {word, translation, from, to, context, at, box?, due?}. No box = box 1, no due = due now.
import { DS } from './ds.js';

  const DAY = 864e5;
  DS.REVIEW_DAYS = [1, 3, 7, 21]; // wait after a review, by the box the word is in afterwards
  DS.REVIEW_SESSION = 15;

  // Words due at `now`, longest overdue first, at most n.
  DS.dueWords = (words, now, n = DS.REVIEW_SESSION) =>
    words.filter(w => (w.due ?? 0) <= now).sort((a, b) => (a.due ?? 0) - (b.due ?? 0)).slice(0, n);

  // Right: one box up (max 4), next review after that box's wait. Wrong: back to box 1, tomorrow.
  DS.gradeWord = (w, correct, now) => {
    const box = correct ? Math.min(4, (w.box || 1) + 1) : 1;
    return { ...w, box, due: now + (correct ? DS.REVIEW_DAYS[box - 1] : DS.REVIEW_DAYS[0]) * DAY };
  };

  const shuffle = (a, rnd) => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const pickOthers = (pool, n, rnd) => shuffle([...new Set(pool)], rnd).slice(0, n);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // The sentence the word was saved from, with the word blanked; null when the word is not in it.
  DS.blankContext = (w) => {
    if (!w.context || !w.word) return null;
    const re = new RegExp(`(?<![A-Za-z])${esc(w.word)}(?![A-Za-z])`, 'i');
    return re.test(w.context) ? w.context.replace(re, '____') : null;
  };

  // Wrong options for English words can come from the CEFR lists when the notebook is too small.
  const fillers = w => (w.from === 'en' && DS.WORDS_EN ? ['A2', 'B1', 'B2'].flatMap(l => (DS.WORDS_EN[l] || '').split(' ')).filter(x => x.length > 3) : []);

  // One multiple-choice question for `w`, or null when there is not enough to choose from. Types:
  //   choice: the word, pick its translation; reverse: the translation, pick the word; cloze: the saved sentence with the word blanked, pick the word.
  // Distractors come from the other saved words of the same pair, topped up from the CEFR lists (English only).
  DS.makeQuestion = (w, all, rnd = Math.random) => {
    const others = all.filter(x => x !== w && x.from === w.from && x.to === w.to);
    const ne = x => x.toLowerCase() !== w.word.toLowerCase();
    const saved = pickOthers(others.map(x => x.word).filter(ne), 3, rnd);
    const words = saved.length >= 3 ? saved : [...saved, ...pickOthers(fillers(w).filter(x => ne(x) && !saved.includes(x)), 3 - saved.length, rnd)];
    const trs = pickOthers(others.map(x => x.translation).filter(x => x && x !== w.translation), 3, rnd);
    const blank = DS.blankContext(w);
    const pick = (type, prompt, right, wrong, extra = {}) => ({ type, prompt, options: shuffle([right, ...wrong], rnd), answer: right, ...extra });
    const make = {
      choice: () => trs.length === 3 && pick('choice', w.word, w.translation, trs),
      reverse: () => words.length === 3 && pick('reverse', w.translation, w.word, words),
      cloze: () => blank && words.length === 3 && pick('cloze', blank, w.word, words, { hint: w.translation }),
    };
    const avail = Object.keys(make).filter(k => make[k]());
    return avail.length ? make[avail[Math.floor(rnd() * avail.length)]]() : null;
  };

  // A session: the due words with their questions. With nothing due it is free practice (`free`): a random pick that leaves the schedule alone.
  // Words without enough material for a question are left out.
  DS.makeSession = (words, now, rnd = Math.random, n = DS.REVIEW_SESSION) => {
    const build = ws => ws.map(w => ({ word: w, q: DS.makeQuestion(w, words, rnd) })).filter(i => i.q);
    const due = build(DS.dueWords(words, now, n));
    return due.length ? due : build(shuffle(words, rnd).slice(0, n)).map(i => ({ ...i, free: true }));
  };
export default DS;

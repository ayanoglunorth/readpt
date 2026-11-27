// One placement test run: up to 50 word questions (every sixth a non-word) chosen adaptively, then 15 cloze items.
// A pure state machine; the page only shows `current` and calls `answer`. Needs ability.js, cloze-en.js and vocab.js.
import { DS } from './ds.js';

  const CLOZE_TOTAL = 15;

  // current: {kind:'word', word, rank} | {kind:'fake', word} | {kind:'cloze', q, options, answer, level, index}
  // answer(value): boolean for words and non-words, the chosen option index for cloze items (-1 = "I don't know").
  DS.placementStart = (rand = Math.random) => {
    const pool = DS.placementPool(), askedWords = new Set(), askedCloze = new Set();
    const fakes = [...DS.FAKE_WORDS];
    for (let i = fakes.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [fakes[i], fakes[j]] = [fakes[j], fakes[i]]; }
    let realWords = 0;
    const history = []; // one snapshot per answered question, for back()

    const session = { phase: 'words', n: 0, clozeTotal: CLOZE_TOTAL, current: null, level: null, state: DS.abilityNew() };

    const finish = () => { session.phase = 'done'; session.current = null; session.level = DS.abilityLevel(session.state); };
    const nextCloze = () => {
      const c = session.n < CLOZE_TOTAL && DS.nextCloze(session.state, DS.CLOZE_EN, askedCloze, rand);
      if (!c) return finish();
      askedCloze.add(c.index);
      session.current = { kind: 'cloze', ...c };
    };
    const nextWord = () => {
      if (DS.abilityDone(session.state, realWords)) { session.phase = 'cloze'; session.n = 0; return nextCloze(); }
      if (session.n % 6 === 5 && fakes.length) return void (session.current = { kind: 'fake', word: fakes.pop() });
      const w = DS.nextWord(session.state, pool, askedWords, rand);
      if (!w) { session.phase = 'cloze'; session.n = 0; return nextCloze(); }
      askedWords.add(w.word);
      session.current = { kind: 'word', ...w };
    };

    session.answer = value => {
      const it = session.current;
      if (!it) return;
      history.push({ state: session.state, n: session.n, phase: session.phase, current: it, realWords, aw: [...askedWords], ac: [...askedCloze], fk: [...fakes] });
      if (it.kind === 'cloze') session.state = DS.abilityUpdate(session.state, { kind: 'cloze', rank: DS.LEVEL_MID[it.level], skip: value === -1 }, value === it.answer);
      else {
        session.state = DS.abilityUpdate(session.state, it.kind === 'fake' ? { kind: 'fake' } : { kind: 'word', rank: it.rank }, !!value);
        if (it.kind === 'word') realWords++;
      }
      session.n++;
      session.phase === 'words' ? nextWord() : nextCloze();
    };

    session.canBack = () => history.length > 0;
    session.back = () => {
      const h = history.pop();
      if (!h) return;
      Object.assign(session, { state: h.state, n: h.n, phase: h.phase, current: h.current, level: null });
      realWords = h.realWords;
      askedWords.clear(); h.aw.forEach(w => askedWords.add(w));
      askedCloze.clear(); h.ac.forEach(c => askedCloze.add(c));
      fakes.splice(0, fakes.length, ...h.fk);
    };

    nextWord();
    return session;
  };
export default DS;

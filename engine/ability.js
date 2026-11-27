// Level estimate for the placement test. One hidden number, theta = "how far down the subtitle-frequency list the learner
// knows words", kept as a probability grid over ln(theta). Words, non-words and cloze items all update the same grid.
// Needs words-en.js, freq-en.js and vocab.js. Pure; runs in Node too.
import { DS } from './ds.js';

  const N = 70, LO = Math.log(150), HI = Math.log(9000);
  const XS = Array.from({ length: N }, (_, i) => LO + (HI - LO) * i / (N - 1));
  // Tunable constants (see the design doc): slip, slope of the word and cloze curves, cloze chance level, the safe quantile,
  // the stop rule and the CEFR cut points on the frequency-rank scale.
  const S = 0.05, TAU = 0.6, TAU_CLOZE = 0.7, CLOZE_GUESS = 0.25, Q = 0.3, STOP_SD = 0.25, MIN_WORDS = 25, MAX_WORDS = 50;
  const LEVEL_CUTS = [800, 1800, 3000, 4500, 6500];
  DS.LEVEL_MID = { A1: 500, A2: 1300, B1: 2400, B2: 3700, C1: 5500, C2: 8000 };

  const sig = z => 1 / (1 + Math.exp(-z));
  const norm = a => { const t = a.reduce((x, y) => x + y, 0) || 1; return a.map(v => v / t); };

  DS.abilityNew = level => {
    const mu = Math.log(level ? DS.LEVEL_MID[level] : 1800), sd = level ? 0.9 : 0.8;
    return { post: norm(XS.map(x => Math.exp(-0.5 * ((x - mu) / sd) ** 2))), fakeYes: 0, fakeN: 0 };
  };

  // Share of non-words the learner claims to know: the "says yes anyway" rate, with a prior of one yes in ten.
  DS.abilityGuess = st => Math.min(0.6, (st.fakeYes + 1) / (st.fakeN + 10));

  // skip: the learner chose "I don't know" instead of guessing, so no chance of a lucky hit.
  // item: {kind:'word', rank} | {kind:'fake'} | {kind:'cloze', rank, skip?}; known: said yes / answered right.
  DS.abilityUpdate = (st, item, known) => {
    if (item.kind === 'fake') return { ...st, fakeN: st.fakeN + 1, fakeYes: st.fakeYes + (known ? 1 : 0) };
    const lr = Math.log(item.rank), g = item.kind === 'cloze' ? (item.skip ? 0 : CLOZE_GUESS) : DS.abilityGuess(st), tau = item.kind === 'cloze' ? TAU_CLOZE : TAU;
    const post = norm(st.post.map((p, i) => {
      const yes = g + (1 - g - S) * sig((XS[i] - lr) / tau);
      return p * (known ? yes : 1 - yes);
    }));
    return { ...st, post };
  };

  DS.abilityQuantile = (st, q) => {
    let c = 0;
    for (let i = 0; i < N; i++) { c += st.post[i]; if (c >= q) return Math.exp(XS[i]); }
    return Math.exp(HI);
  };

  DS.abilitySd = st => {
    const m = st.post.reduce((a, p, i) => a + p * XS[i], 0);
    return Math.sqrt(st.post.reduce((a, p, i) => a + p * (XS[i] - m) ** 2, 0));
  };

  // The low quantile, not the median: when unsure, the lower level. A learner who says yes to half of the non-words (three or
  // more asked) is not reading the words, so the level is capped at A2 whatever else they claim.
  DS.abilityLevel = st => {
    const cap = st.fakeN >= 3 && st.fakeYes / st.fakeN >= 0.5 ? 1 : 5;
    return DS.LEVELS[Math.min(cap, LEVEL_CUTS.filter(c => DS.abilityQuantile(st, Q) >= c).length)];
  };

  // Real words that can be asked: in the CEFR lists, ranked by subtitle frequency, long enough to be a fair question.
  let pool = null;
  DS.placementPool = () => pool ||= [...new Set(Object.values(DS.WORDS_EN).flatMap(l => l.split(' ')))]
    .filter(w => w.length >= 4 && DS.freqRank(w)).map(word => ({ word, rank: DS.freqRank(word) })).sort((a, b) => a.rank - b.rank);

  const pickNear = (cands, rand) => cands[Math.floor(rand() * cands.length)] ?? null;

  // One of the five unasked words closest to the current median: the most informative questions.
  DS.nextWord = (st, words, asked, rand = Math.random) => {
    const m = Math.log(DS.abilityQuantile(st, 0.5));
    const near = words.filter(w => !asked.has(w.word)).map(w => [Math.abs(Math.log(w.rank) - m), w]).sort((a, b) => a[0] - b[0]).slice(0, 5);
    return pickNear(near.map(x => x[1]), rand);
  };

  DS.nextCloze = (st, bank, asked, rand = Math.random) => {
    const m = Math.log(DS.abilityQuantile(st, 0.5));
    const left = bank.map((c, index) => ({ ...c, index })).filter(c => !asked.has(c.index));
    if (!left.length) return null;
    const dist = c => Math.abs(Math.log(DS.LEVEL_MID[c.level]) - m);
    const best = Math.min(...left.map(dist));
    return pickNear(left.filter(c => dist(c) === best), rand);
  };

  DS.abilityDone = (st, nWords) => nWords >= MAX_WORDS || (nWords >= MIN_WORDS && DS.abilitySd(st) < STOP_SD);

  // Pre-video quiz answers carry the same signal as placement words; words without a frequency rank say nothing.
  DS.abilityAfterQuiz = (st, answers) => answers.reduce((s, a) => {
    const rank = DS.freqRank(a.word);
    return rank ? DS.abilityUpdate(s, { kind: 'word', rank }, a.known) : s;
  }, st);
export default DS;

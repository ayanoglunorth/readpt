// Pure vocabulary logic for the pre-video quiz: map a subtitle word to a CEFR headword, pick words to quiz, estimate a level.
// Data comes from words-en.js (CEFR-J + Octanove). Runs in Node too.
import { DS } from './ds.js';

  DS.LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  DS.LEVEL_LABELS = ['A1 · Başlangıç', 'A2 · Temel', 'B1 · Orta', 'B2 · Orta üstü', 'C1 · İleri', 'C2 · Usta'];
  DS.QUIZ_MIN = 3; // fewer candidates than this and the card is not worth showing

  // Spoken forms the CEFR lists lack but films say all the time; levels are our own judgement (index in LEVELS).
  const SPOKEN = { 1: 'gonna wanna gotta', 2: 'kinda sorta lemme dunno gotcha nope yep', 3: "ain't y'all cuz" };

  let ranks = null; // word -> index in LEVELS
  const rankMap = () => ranks ||= new Map([
    ...DS.LEVELS.flatMap((l, r) => (DS.WORDS_EN?.[l] || '').split(' ').filter(Boolean).map(w => [w, r])),
    ...Object.entries(SPOKEN).flatMap(([r, ws]) => ws.split(' ').map(w => [w, +r])),
  ]);

  // form base, whitespace separated
  const IRREGULAR = Object.fromEntries(`was be were be been be am be is be are be had have has have did do does do done do went go gone go goes go
    saw see seen see took take taken take gave give given give came come ran run made make said say got get gotten get knew know known know
    thought think found find told tell felt feel left leave kept keep held hold brought bring bought buy caught catch taught teach sold sell
    sent send spent spend built build lost lose met meet paid pay heard hear sat sit stood stand understood understand wrote write written write
    spoke speak spoken speak broke break broken break chose choose chosen choose drove drive driven drive ate eat eaten eat fell fall fallen fall
    flew fly flown fly forgot forget forgotten forget grew grow grown grow hid hide hidden hide rode ride ridden ride rose rise risen rise
    sang sing sung sing swam swim swum swim threw throw thrown throw woke wake woken wake wore wear worn wear won win began begin begun begin
    drank drink drunk drink drew draw drawn draw shook shake shaken shake stole steal stolen steal slept sleep led lead meant mean dealt deal
    dug dig fed feed fought fight hung hang laid lay lit light lent lend bent bend bit bite bitten bite blew blow blown blow
    children child men man women woman feet foot teeth tooth mice mouse`.split(/\s+/).reduce((a, w, i, all) => i % 2 ? a : [...a, [w, all[i + 1]]], []));

  // Possible base forms of an inflected word; only a list lookup decides which one is real.
  const candidates = (w, derive = true) => {
    const out = [];
    const add = s => { if (s.length >= 3) out.push(s); };
    const stem = (s, ...extra) => { add(s); extra.forEach(e => add(s + e)); if (s.at(-1) === s.at(-2)) add(s.slice(0, -1)); };
    if (w.endsWith('ies')) add(w.slice(0, -3) + 'y');
    if (w.endsWith('es')) add(w.slice(0, -2));
    if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1));
    if (w.endsWith('ied')) add(w.slice(0, -3) + 'y');
    if (w.endsWith('ed')) stem(w.slice(0, -2), 'e');
    if (w.endsWith('ing')) stem(w.slice(0, -3), 'e');
    if (derive && w.endsWith('ier')) add(w.slice(0, -3) + 'y');
    if (derive && w.endsWith('iest')) add(w.slice(0, -4) + 'y');
    if (derive && w.endsWith('er')) stem(w.slice(0, -2), 'e');
    if (derive && w.endsWith('est')) stem(w.slice(0, -3), 'e');
    if (derive && w.endsWith('ily')) add(w.slice(0, -3) + 'y');
    if (derive && w.endsWith('ly')) add(w.slice(0, -2));
    return out;
  };

  // The word itself, its irregular base and its possible bases; a list lookup decides which one is real.
  // derive = false leaves out -er/-est/-ly, which also end real words (dagger, water, family).
  DS.baseForms = (w, derive = true) => [w, ...(IRREGULAR[w] ? [IRREGULAR[w]] : []), ...candidates(w, derive)];

  // {word, rank} of the list entry a subtitle word belongs to, or null. The lowest level among the word itself and
  // its possible bases wins, so a base that is easy never gets quizzed as a "hard" inflected form.
  // shortcut: a wrong base (news -> new) only ever lowers the level, so the word is skipped, never wrongly taught.
  DS.headword = token => {
    const w = String(token).toLowerCase().replace(/[’‘]/g, "'");
    const r = rankMap();
    let best = null;
    const consider = word => {
      const rank = r.get(word);
      if (rank !== undefined && (!best || rank <= best.rank)) best = { word, rank };
    };
    consider(w);
    if (IRREGULAR[w]) consider(IRREGULAR[w]);
    candidates(w).forEach(consider);
    return best;
  };

  // 1-based subtitle-frequency rank of a word or, failing that, its headword (freq-en.js), or null when it is not ranked.
  let freq = null;
  DS.freqRank = word => {
    freq ||= new Map((DS.FREQ_EN || '').split(' ').map((w, i) => [w, i + 1]));
    const w = String(word).toLowerCase();
    return freq.get(w) || freq.get(DS.headword(w)?.word) || null;
  };

  DS.WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;

  // Words in `texts` above `levelRank` that `vocab` (word -> 'k' | 'l') has not seen, ranked: next two levels first, then by
  // how often the video says them, then easier first.
  DS.pickQuizWords = (texts, levelRank, vocab, n = 20) => {
    const found = new Map();
    for (const t of texts) {
      for (const m of t.matchAll(DS.WORD_RE)) {
        const h = DS.headword(m[0]);
        if (!h || h.rank <= levelRank || vocab[h.word]) continue;
        const e = found.get(h.word) || { word: h.word, rank: h.rank, count: 0 };
        e.count++;
        found.set(h.word, e);
      }
    }
    return DS.rankQuizWords([...found.values()], levelRank, n);
  };

  // Candidates {word, rank, count}: the next two levels first, then the most frequent in the text, then easier first.
  DS.rankQuizWords = (list, levelRank, n) => {
    const far = w => (w.rank - levelRank > 2 ? 1 : 0);
    return [...list]
      .sort((a, b) => far(a) - far(b) || b.count - a.count || a.rank - b.rank || a.word.localeCompare(b.word))
      .slice(0, n);
  };

  // English-looking words that do not exist. "Biliyorum" to one of these is overclaiming, which the estimate corrects for.
  DS.FAKE_WORDS = `brelling flonder dratchet morvent sprintle kelvorn plintage gruntal vossible trennic calopure wimsical durlish
    fenstrate plumbery shandrel odvance ristamble glenteous pomulate`.split(/\s+/);

  // Runs `fetchFn(key)` at most `limit` at a time, once per key; `urgent` jumps the queue. A failed key is forgotten so it can be retried.
  DS.limitedFetcher = (fetchFn, limit = 3) => {
    const cache = new Map(), queue = [];
    let live = 0;
    const pump = () => {
      while (live < limit && queue.length) {
        const job = queue.shift();
        live++;
        Promise.resolve().then(() => fetchFn(job.key)).then(job.res, job.rej).finally(() => { live--; pump(); });
      }
    };
    return {
      get(key, urgent = false) {
        let p = cache.get(key);
        if (p) { if (urgent) { const i = queue.findIndex(j => j.key === key); if (i > 0) queue.unshift(queue.splice(i, 1)[0]); } return p; }
        p = new Promise((res, rej) => { queue[urgent ? 'unshift' : 'push']({ key, res, rej }); });
        p.catch(() => cache.delete(key));
        cache.set(key, p);
        pump();
        return p;
      },
    };
  };
export default DS;

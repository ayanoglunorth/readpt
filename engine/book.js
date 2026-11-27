// Book text helpers: quiz words from page text (beyond the CEFR lists), PDF text items to paragraphs, page range clamp.
// Needs vocab.js, words-en.js, freq-en.js and freq-big.js. Pure; ASCII letter classes only, because Hermes lacks the Unicode word segmenter and property escapes.
import { DS } from './ds.js';

let bigMap = null;
const bigRank = w => (bigMap ||= new Map(DS.BIG_EN.split(' ').map((x, i) => [x, i + 1]))).get(w);
const bigLevel = r => DS.BIG_CUTS.filter(c => r >= c).length;

// {word, rank} for a book token: CEFR level when the word is in the CEFR lists, else the level of its place in the long
// frequency list (index 0..5 as in DS.LEVELS). null when the word is not an English word we know.
DS.bookHeadword = token => {
  const w = String(token).toLowerCase().replace(/[’‘]/g, "'").replace(/'s$/, '');
  const cefr = DS.headword(w);
  if (cefr) return cefr;
  if (bigRank(w)) return { word: w, rank: bigLevel(bigRank(w)) };
  let best = null;
  for (const b of DS.baseForms(w, false)) {
    const r = bigRank(b);
    if (r && (!best || r < best.r)) best = { word: b, r };
  }
  return best && { word: best.word, rank: bigLevel(best.r) };
};

const sentenceStart = (t, i) => {
  for (i--; i >= 0 && /[\s"“”‘'(\[—-]/.test(t[i]); i--) if (t[i] === '\n') return true;
  return i < 0 || /[.!?…]/.test(t[i]);
};

// Like DS.pickQuizWords, for book text. A word that never appears in lower case and is capitalized mid-sentence (or at a
// sentence start twice or more) is a name and is skipped.
DS.pickBookWords = (texts, levelRank, vocab, n = 20) => {
  const found = new Map();
  for (const t of texts) {
    for (const m of t.matchAll(DS.WORD_RE)) {
      const h = DS.bookHeadword(m[0]);
      if (!h || h.rank <= levelRank || vocab[h.word]) continue;
      const e = found.get(h.word) || { word: h.word, rank: h.rank, count: 0, lower: 0, capMid: 0, capStart: 0 };
      e.count++;
      if (!/^[A-Z][a-z']/.test(m[0])) e.lower++;
      else if (sentenceStart(t, m.index)) e.capStart++;
      else e.capMid++;
      found.set(h.word, e);
    }
  }
  const real = [...found.values()].filter(e => e.lower || (!e.capMid && e.capStart < 2));
  return DS.rankQuizWords(real.map(({ word, rank, count }) => ({ word, rank, count })), levelRank, n);
};

const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

// Items of one page {str, x, y, h, w?} (PDF coordinates, y grows upward) -> lines [{text, y, h}], top to bottom.
const toLines = items => {
  const sorted = items.filter(i => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const it of sorted) {
    const cur = lines.at(-1);
    if (cur && Math.abs(it.y - cur.y) <= Math.max(2, it.h * 0.5)) cur.items.push(it);
    else lines.push({ y: it.y, h: it.h, items: [it] });
  }
  return lines.map(l => {
    const its = l.items.sort((a, b) => a.x - b.x);
    let text = '', end = null;
    for (const it of its) {
      if (end !== null && it.x - end > it.h * 0.15 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
      text += it.str;
      end = it.x + (it.w ?? it.str.length * it.h * 0.5);
    }
    return { text: text.trim(), y: l.y, h: Math.max(...its.map(i => i.h)) };
  });
};

// True when a page's text is mostly not letters: a PDF whose fonts have no Unicode map extracts as symbols like `;" "$8`.
// Letters are ASCII plus Latin-1/Latin Extended (Turkish included) (Hermes has no Unicode property classes). Short pages are never judged.
DS.garbled = paras => {
  const s = paras.join('').replace(/\s/g, '');
  return s.length >= 40 && (s.match(/[A-Za-zÀ-ɏ]/g) || []).length / s.length < 0.5;
};

const headerKey = text => text.toLowerCase().replace(/\d+/g, '').replace(/\s+/g, ' ').trim();

// rawPages: [{items}] straight from pdf.js. Returns paragraphs per page. Bare page numbers and a first/last line that
// repeats on 3 or more pages (running header or footer) are dropped.
DS.buildPages = rawPages => {
  const pages = rawPages.map(p => toLines(p.items));
  const seen = new Map();
  for (const lines of pages) for (const l of [lines[0], lines.at(-1)]) if (l) seen.set(headerKey(l.text), (seen.get(headerKey(l.text)) || 0) + 1);
  const junk = l => /^(page\s+)?\d{1,4}$/i.test(l.text) || (headerKey(l.text) && seen.get(headerKey(l.text)) >= 3);
  return pages.map(lines => {
    const keep = lines.filter((l, i) => !((i === 0 || i === lines.length - 1) && junk(l)));
    const gaps = keep.slice(1).map((l, i) => keep[i].y - l.y);
    const limit = gaps.length ? Math.max(Math.min(...gaps) * 1.5, Math.max(...keep.map(l => l.h)) * 1.8) : 0;
    const paras = [];
    keep.forEach((l, i) => {
      const prev = paras.at(-1);
      if (i === 0 || keep[i - 1].y - l.y > limit) paras.push(l.text);
      else paras[paras.length - 1] = /[A-Za-z]-$/.test(prev) && /^[a-z]/.test(l.text) ? prev.slice(0, -1) + l.text : prev + ' ' + l.text;
    });
    return paras;
  });
};

// 1-based page range, ordered and inside the book.
// maxSpan (optional) caps how many pages the range may cover.
DS.clampRange = (from, to, pageCount, maxSpan) => {
  const c = n => Math.max(1, Math.min(n, pageCount));
  const a = c(Math.min(from, to));
  const b = c(Math.max(from, to));
  return [a, maxSpan ? Math.min(b, a + maxSpan - 1) : b];
};

// Index of the last paragraph whose top (ys[i]) is at or above y; 0 when there is none.
DS.paraAt = (ys, y) => Math.max(0, ys.reduce((acc, v, i) => (v <= y ? i : acc), 0));

// The page of a paired book (other language) that matches `page`, shifted by offset and kept inside it.
DS.pairedPage = (page, offset, pageCount) => Math.max(1, Math.min(page + offset, pageCount));

// [{text, word, start}] covering the whole text: words (letters and inner apostrophes) and what lies between them.
DS.segments = text => {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(DS.WORD_RE)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), word: false, start: last });
    out.push({ text: m[0], word: true, start: m.index });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), word: false, start: last });
  return out;
};

// The sentence (up to and including its . ! ? ending) that contains character index i.
DS.sentenceAt = (text, i) => {
  let a = i;
  while (a > 0 && !/[.!?]/.test(text[a - 1])) a--;
  let b = i;
  while (b < text.length && !/[.!?]/.test(text[b])) b++;
  return text.slice(a, Math.min(b + 1, text.length)).trim();
};

export default DS;

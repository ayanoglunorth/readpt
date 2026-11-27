import test from 'node:test';
import assert from 'node:assert';
import '../words-en.js';
import '../freq-en.js';
import '../freq-big.js';
import DS from '../vocab.js';
import '../book.js';

const line = (str, y) => ({ str, x: 50, y, h: 12 });
const words = r => r.map(w => w.word);

test('bookHeadword: inflection folds to a base outside the CEFR lists, with a level', () => {
  const h = DS.bookHeadword('scowled');
  assert.strictEqual(h.word, 'scowl');
  assert.strictEqual(h.rank, 5);
});

test('bookHeadword: CEFR words keep their CEFR level, unknown and non-words are null', () => {
  assert.ok(DS.bookHeadword('walked').rank <= 1);
  assert.strictEqual(DS.bookHeadword('walked').word, 'walk');
  assert.strictEqual(DS.bookHeadword('xyzzy'), null);
  assert.strictEqual(DS.bookHeadword('hogwarts'), null);
});

test('pickBookWords: a word that only appears capitalized and repeatedly is a name', () => {
  const r = DS.pickBookWords(['Harry walked home. Then Harry scowled at the gloomy dagger.'], 1, {});
  assert.ok(!words(r).includes('harry'));
  assert.ok(words(r).includes('scowl') && words(r).includes('gloomy') && words(r).includes('dagger'));
});

test('pickBookWords: a lowercase use rescues a capitalized word; one sentence-start use is kept', () => {
  assert.ok(words(DS.pickBookWords(['Dagger fell. A dagger fell. Dagger fell again.'], 1, {})).includes('dagger'));
  assert.ok(words(DS.pickBookWords(['Gloomy weather came.'], 1, {})).includes('gloomy'));
});

test('pickBookWords: known words skipped, cap respected, most frequent first', () => {
  const t = ['The dagger and the dagger and the gloomy room.'];
  assert.strictEqual(words(DS.pickBookWords(t, 1, { dagger: 'k' })).includes('dagger'), false);
  assert.strictEqual(DS.pickBookWords(t, 1, {}, 1).length, 1);
  assert.strictEqual(DS.pickBookWords(t, 1, {})[0].word, 'dagger');
});

test('buildPages: joins hyphenated lines, splits paragraphs, drops header and page numbers', () => {
  const page = n => ({ items: [line('MY BOOK TITLE', 800), line('He was walk-', 700), line('ing home.', 686), line('Second paragraph.', 640), line(String(n), 40)] });
  const pages = DS.buildPages([page(1), page(2), page(3)]);
  assert.deepStrictEqual(pages[0], ['He was walking home.', 'Second paragraph.']);
  assert.strictEqual(pages.length, 3);
});

test('buildPages: a page without text items gives no paragraphs', () => {
  assert.deepStrictEqual(DS.buildPages([{ items: [] }]), [[]]);
});

test('clampRange: ordered and inside the book', () => {
  assert.deepStrictEqual(DS.clampRange(5, 2, 3), [2, 3]);
  assert.deepStrictEqual(DS.clampRange(0, 10, 3), [1, 3]);
  assert.deepStrictEqual(DS.clampRange(2, 2, 9), [2, 2]);
});

test('segments: words and the text between them, with start offsets', () => {
  const s = DS.segments("Hi, it's Tom.");
  assert.deepStrictEqual(s.map(x => [x.text, x.word, x.start]), [['Hi', true, 0], [', ', false, 2], ["it's", true, 4], [' ', false, 8], ['Tom', true, 9], ['.', false, 12]]);
  assert.deepStrictEqual(DS.segments(''), []);
  assert.deepStrictEqual(DS.segments('...').map(x => x.word), [false]);
});

test('sentenceAt: the sentence around a character index', () => {
  const t = 'One two. Three four! Five six';
  assert.strictEqual(DS.sentenceAt(t, 12), 'Three four!');
  assert.strictEqual(DS.sentenceAt(t, 0), 'One two.');
  assert.strictEqual(DS.sentenceAt(t, 25), 'Five six');
});

test('clampRange: maxSpan caps the end', () => {
  assert.deepStrictEqual(DS.clampRange(10, 90, 1000, 50), [10, 59]);
  assert.deepStrictEqual(DS.clampRange(90, 10, 1000, 50), [10, 59]);
  assert.deepStrictEqual(DS.clampRange(1, 1, 1, 50), [1, 1]);
});

test('paraAt: last paragraph at or above y', () => {
  assert.strictEqual(DS.paraAt([0, 100, 250], 120), 1);
  assert.strictEqual(DS.paraAt([0, 100, 250], 999), 2);
  assert.strictEqual(DS.paraAt([], 5), 0);
  assert.strictEqual(DS.paraAt([0, 100], -5), 0);
});

test('pairedPage: offset and clamp', () => {
  assert.strictEqual(DS.pairedPage(10, 2, 300), 12);
  assert.strictEqual(DS.pairedPage(1, -3, 300), 1);
  assert.strictEqual(DS.pairedPage(299, 5, 300), 300);
});

test('garbled: symbol soup from an unmapped font is flagged, real prose in English and Turkish is not', () => {
  assert.ok(DS.garbled([';" "$8 "$:"8 $ 9:8G#8"& <"    \'; &;" 8&$  & ?, =" ;"  88 $;\' 8":::;" $   $ $']));
  assert.ok(!DS.garbled(['George ran after the paper boat that Bill had made, while the rain fell on the window.']));
  assert.ok(!DS.garbled(['George’un peşinden koştuğu kağıttan gemi Bill’in eseriydi. Onu yatağına oturmuş görmüştü.']));
  assert.ok(!DS.garbled(['1 2'])); // too short to judge
});

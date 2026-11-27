// Everything the app remembers, in AsyncStorage as JSON. Reads never throw: a missing or broken value gives the default.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Prefs = { level: string; rate: number; lang: 'en-US' | 'en-GB'; font: number; placed: boolean; theme: number; dim: number; align: 'left' | 'justify'; leading: number; voice?: string };
// tr: the paired Turkish PDF (pages stored under tr.id); offset shifts which Turkish page matches an English page.
export type Book = { id: string; title: string; pages: number; textPages: number; at: number; tr?: { id: string; pages: number; offset: number } };
export type Pos = { page: number; para: number };
export type SavedWord = { word: string; translation: string; from: 'en'; to: 'tr'; context: string; at: number; box?: number; due?: number };
export type Vocab = Record<string, 'k' | 'l'>;

export const DEFAULT_PREFS: Prefs = { level: 'A2', rate: 0.8, lang: 'en-US', font: 19, placed: false, theme: 0, dim: 1, align: 'left', leading: 1 };

const read = async <T,>(key: string, fallback: T): Promise<T> => {
  try { const s = await AsyncStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
};
const write = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v));

// Read-modify-write of one key runs one at a time, so two quick saves cannot overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
const update = <T,>(key: string, fallback: T, fn: (v: T) => T): Promise<T> => {
  const run = queue.then(async () => { const v = fn(await read(key, fallback)); await write(key, v); return v; });
  queue = run.catch(() => {});
  return run;
};

export const getPrefs = async (): Promise<Prefs> => ({ ...DEFAULT_PREFS, ...(await read<Partial<Prefs>>('prefs', {})) });
export const setPrefs = (p: Partial<Prefs>) => update<Partial<Prefs>>('prefs', {}, v => ({ ...v, ...p }));

export const getBooks = () => read<Book[]>('books', []);
export const addBook = (b: Book) => update<Book[]>('books', [], v => [b, ...v.filter(x => x.id !== b.id)]);
export const setBookTr = (id: string, tr: Book['tr'] | null) => update<Book[]>('books', [], v => v.map(b => (b.id === id ? { ...b, tr: tr ?? undefined } : b)));
export const removeBook = (id: string) => update<Book[]>('books', [], v => v.filter(x => x.id !== id));

export const getPos = (id: string) => read<Pos>('pos:' + id, { page: 1, para: 0 });
export const setPos = (id: string, p: Pos) => write('pos:' + id, p);

export const getVocab = () => read<Vocab>('vocab', {});
export const addVocab = (more: Vocab) => update<Vocab>('vocab', {}, v => ({ ...v, ...more }));

export const getWords = () => read<SavedWord[]>('words', []);
// A word is saved once; saving it again keeps the first entry.
export const saveWord = (w: SavedWord) => update<SavedWord[]>('words', [], v => (v.some(x => x.word === w.word) ? v : [w, ...v]));
export const changeWords = (fn: (v: SavedWord[]) => SavedWord[]) => update<SavedWord[]>('words', [], fn);

export const getTranslations = () => read<Record<string, string>>('tr', {});
export const putTranslation = (word: string, text: string) => update<Record<string, string>>('tr', {}, v => ({ ...v, [word]: text }));

// Anonymous lookup totals waiting to be reported: resolved on the phone vs sent on to the Worker.
export type Stats = { device: number; worker: number };
const NO_STATS: Stats = { device: 0, worker: 0 };
export const addStats = (s: Stats) => update<Stats>('stats', NO_STATS, v => ({ device: v.device + s.device, worker: v.worker + s.worker }));
export const takeStats = async (): Promise<Stats> => { let taken = NO_STATS; await update<Stats>('stats', NO_STATS, v => { taken = v; return NO_STATS; }); return taken; };

export const storage = { read, write, remove: (key: string) => AsyncStorage.removeItem(key) };

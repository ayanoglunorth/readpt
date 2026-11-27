// Book identity from the file bytes: FNV-1a over the size, the first 512 KB and the last 512 KB, plus the size.
// shortcut: a change only in the middle of a very large file keeps the id; fine for "same PDF imported twice".
import { DS } from './ds.js';

const EDGE = 512 * 1024;

DS.bookId = bytes => {
  let h = 0x811c9dc5;
  const feed = b => { h = Math.imul(h ^ b, 0x01000193) >>> 0; };
  const n = bytes.length;
  for (let s = n; s > 0; s = Math.floor(s / 256)) feed(s & 255);
  for (let i = 0; i < Math.min(n, EDGE); i++) feed(bytes[i]);
  for (let i = Math.max(EDGE, n - EDGE); i < n; i++) feed(bytes[i]);
  return `${h.toString(16).padStart(8, '0')}-${n}`;
};

export default DS;

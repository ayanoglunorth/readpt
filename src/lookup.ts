// One-word English -> Turkish meaning from the Looptions Worker (Microsoft Translator free tier + cache). Words only, never a sentence.
import { Platform } from 'react-native';
import { DS } from '../engine';
import { addStats, getTranslations, putTranslation, takeStats } from './store';

// Set EXPO_PUBLIC_LOOKUP_URL (see .env.example) to the address of your own translation worker.
const URL = process.env.EXPO_PUBLIC_LOOKUP_URL ?? '';

const fetcher = DS.limitedFetcher(async (word: string) => {
  const r = await fetch(URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: word, from: 'en', to: 'tr' }), signal: AbortSignal.timeout(8000),
  });
  const j = await r.json();
  if (!j.text) throw new Error(j.error || 'empty');
  return j.text as string;
}, 3);

// Loaded lazily: the package throws on import when the installed app binary lacks its native module (Expo Go, an old build); then everything goes to the Worker.
let native: typeof import('expo-translate-text') | null | undefined;
function engine() {
  if (native === undefined) { try { native = require('expo-translate-text'); } catch { native = null; } }
  return native;
}

// On-device engine (Apple Translation on iOS 18+, Google ML Kit on Android). Null when unavailable, model not downloaded yet, or no real translation.
async function onDevice(word: string): Promise<string | null> {
  try {
    const e = engine();
    if (!e) return null;
    const r = await e.onTranslateTask({ input: word, sourceLangCode: 'en', targetLangCode: 'tr' });
    const out = [r.translatedTexts].flat()[0];
    const text = typeof out === 'string' ? out.trim() : '';
    return text && text.toLowerCase() !== word ? text : null;
  } catch { return null; }
}

// Anonymous totals (never words) are reported once 20 lookups have piled up; a failed report is put back.
async function count(kind: 'device' | 'worker') {
  const s = await addStats({ device: +(kind === 'device'), worker: +(kind === 'worker') });
  if (s.device + s.worker < 20) return;
  const t = await takeStats();
  if (t.device + t.worker === 0) return; // a concurrent lookup already reported
  try {
    const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stats: t }), signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error();
  } catch { addStats(t).catch(() => {}); }
}

/** Download the en->tr model ahead of the first lookup (iOS asks the user, Android downloads silently). Safe to call repeatedly; failures are ignored. */
export function prepareOnDevice(): void {
  const e = engine();
  if (!e) return;
  if (Platform.OS === 'ios') e.onPrepareTranslation({ sourceLangCode: 'en', targetLangCode: 'tr' }).catch(() => {});
  else e.onTranslateTask({ input: 'hello', sourceLangCode: 'en', targetLangCode: 'tr' }).catch(() => {});
}

/** Meaning of `word`, or null when it cannot be had (offline, quota, unknown). */
export async function lookup(word: string, urgent = false): Promise<string | null> {
  const key = word.toLowerCase();
  const cached = (await getTranslations())[key];
  if (cached) return cached;
  const local = await onDevice(key);
  if (local) { putTranslation(key, local).catch(() => {}); count('device').catch(() => {}); return local; }
  count('worker').catch(() => {});
  try {
    const text: string = await fetcher.get(key, urgent);
    putTranslation(key, text).catch(() => {});
    return text;
  } catch { return null; }
}

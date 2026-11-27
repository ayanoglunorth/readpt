import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

const cache = new Map<string, unknown>();

/** Runs `load` every time the screen gets focus (also on first show) and keeps its result. With a `key` the last result is
 *  shown straight away when the screen opens again (tab screens), so content doesn't pop in after the transition. */
export function useFocusLoad<T>(load: () => Promise<T>, initial: T, key?: string): [T, boolean, () => void] {
  const [value, setValue] = useState<T>(() => (key && cache.has(key) ? (cache.get(key) as T) : initial));
  const [ready, setReady] = useState(() => !!key && cache.has(key));
  const done = useCallback((v: T) => { if (key) cache.set(key, v); setValue(v); setReady(true); }, [key]);
  const reload = useCallback(() => { load().then(done); }, [load, done]);
  useFocusEffect(useCallback(() => {
    let live = true;
    load().then(v => { if (live) done(v); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));
  return [value, ready, reload];
}

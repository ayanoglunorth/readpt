// Phone text-to-speech (expo-speech). Each speak() call gets a run number; callbacks of an older run are ignored, so stop() or a
// new speak() can never trigger the "next paragraph" chain of the run it cut off.
import * as Speech from 'expo-speech';

let run = 0;

export type SpeakOpts = {
  lang: string;
  rate: number;
  voice?: string;
  onBoundary?: (charIndex: number, charLength: number) => void;
  onDone?: () => void;
  onStop?: () => void;
};

export function speak(text: string, o: SpeakOpts) {
  const mine = ++run;
  Speech.stop();
  Speech.speak(text, {
    language: o.lang,
    rate: o.rate,
    voice: o.voice,
    onBoundary: (ev: any) => { if (mine === run && ev && typeof ev.charIndex === 'number') o.onBoundary?.(ev.charIndex, ev.charLength ?? 0); },
    onDone: () => { if (mine === run) o.onDone?.(); },
    onError: () => { if (mine === run) o.onStop?.(); },
  });
}

export function stop() {
  run++;
  Speech.stop();
}

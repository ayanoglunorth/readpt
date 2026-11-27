import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { DS } from '../../engine';
import { changeWords, getWords, type SavedWord } from '../store';
import { Sticker } from '../paper';
import { C, F, T } from '../theme';
import { Btn, Choice, Progress, Screen, Squiggle, styles } from '../ui';

type Item = { word: SavedWord; free?: boolean; q: { type: 'choice' | 'reverse' | 'cloze'; prompt: string; options: string[]; answer: string; hint?: string } };

const ASK = { choice: 'anlamı nedir?', reverse: 'İngilizcesi nedir?', cloze: 'boşluğa hangisi gelir?' };

export default function Practice() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const right = useRef(0);

  useEffect(() => { getWords().then(ws => setItems(DS.makeSession(ws, Date.now()))); }, []);

  if (!items) return <Screen title="Pratik"><Text style={styles.muted}>…</Text></Screen>;
  if (!items.length) return <Screen title="Pratik"><Text style={styles.body}>Pratik için yeterli kelime yok.</Text></Screen>;
  if (i >= items.length) {
    return (
      <Screen title="Pratik">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Text style={{ ...T.hand, fontSize: 28, color: C.orangeDeep }}>bitti{'\u00A0'}</Text>
          <Text style={{ fontFamily: F.black, fontSize: 96, lineHeight: 100, letterSpacing: -3, color: C.ink }}>{right.current}<Text style={{ color: C.muted }}>/{items.length}</Text></Text>
          <Squiggle w={140} />
        </View>
        <Btn label="Kelime defterine dön" arrow onPress={() => router.back()} />
      </Screen>
    );
  }

  const it = items[i];
  const choose = async (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === it.q.answer;
    if (ok) right.current++;
    if (!it.free) await changeWords(v => v.map(w => (w.word === it.word.word ? DS.gradeWord(w, ok, Date.now()) : w)));
  };

  return (
    <Screen title="Pratik" scroll>
      <View style={{ gap: 8 }}>
        <Progress value={i / items.length} />
        <Text style={{ ...styles.muted, fontSize: 13 }}>{i + 1} / {items.length}{it.free ? ' · serbest pratik' : ''}</Text>
      </View>
      <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={6} r={22} seed={7} style={{ marginRight: 6, marginBottom: 6, transform: [{ rotate: '-1deg' }] }} contentStyle={{ padding: 22, gap: 8, minHeight: 170, justifyContent: 'center' }}>
        <Text style={{ ...T.hand, fontSize: 24, color: C.orangeDeep }}>{ASK[it.q.type]}{'\u00A0'}</Text>
        <Text style={{ fontFamily: F.display, fontSize: it.q.type === 'cloze' ? 22 : 34, lineHeight: it.q.type === 'cloze' ? 31 : 38, letterSpacing: -0.5, color: C.ink }}>{it.q.prompt}</Text>
        {it.q.hint && <Text style={styles.muted}>{it.q.hint}</Text>}
      </Sticker>
      {it.q.options.map((o, k) => (
        <Choice key={o} letter={'ABCD'[k]} label={o} disabled={!!picked} onPress={() => choose(o)}
          state={!picked ? 'idle' : o === it.q.answer ? 'right' : o === picked ? 'wrong' : 'dim'} />
      ))}
      {picked && <Btn label="Sonraki" arrow onPress={() => { setPicked(null); setI(n => n + 1); }} />}
    </Screen>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DS } from '../../engine';
import { loadPages } from '../bookFiles';
import { lookup } from '../lookup';
import { addVocab, getPrefs, getVocab, saveWord } from '../store';
import { Grain, Sticker } from '../paper';
import { C, F, T } from '../theme';
import { Btn, Progress, Screen, Squiggle, styles } from '../ui';

type Summary = { known: string[]; unknown: string[] };
const NO_MEANING = 'Anlam bulunamadı';

export default function QuizScreen() {
  const { id, from, to, n } = useLocalSearchParams<{ id: string; from: string; to: string; n: string }>();
  const quiz = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready'>('loading');
  const [, force] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [meaning, setMeaning] = useState<string | null | undefined>(undefined);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    (async () => {
      const [pages, prefs, vocab] = await Promise.all([loadPages(id), getPrefs(), getVocab()]);
      const texts = (pages ?? []).slice(+from - 1, +to).flat();
      const words = DS.pickBookWords(texts, DS.LEVELS.indexOf(prefs.level), vocab, +n);
      quiz.current = DS.quizStart(words);
      setStatus(quiz.current ? 'ready' : 'empty');
    })();
  }, [id, from, to, n]);

  const finish = async () => {
    const s: Summary = quiz.current.summary();
    setSummary(s); // before the save: once the quiz is done there is no card left to render
    await addVocab(DS.quizVocab(s));
  };
  const next = async (known: boolean) => {
    quiz.current.answer(known);
    setFlipped(false); setMeaning(undefined); force(x => x + 1);
    if (quiz.current.done) await finish();
  };
  const dontKnow = () => {
    setFlipped(true);
    lookup(quiz.current.current.word, true).then(setMeaning);
  };
  const skip = async () => { quiz.current.skip(); await finish(); };
  // The saved resume position is not touched: the reader starts at the test's first page and saves only once you read.
  const read = () => router.replace({ pathname: '/read/[id]', params: { id, page: from } });

  if (status === 'loading') return <Screen title="Kelime testi"><Text style={styles.muted}>Kelimeler hazırlanıyor…</Text></Screen>;
  if (status === 'empty') {
    return (
      <Screen title="Kelime testi">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Text style={{ ...T.hand, fontSize: 28, color: C.orangeDeep }}>harika!{'\u00A0'}</Text>
          <Text style={{ ...T.title, textAlign: 'center' }}>Bu sayfalarda öğrenilecek yeni kelime yok.</Text>
        </View>
        <Btn label="Okumaya başla" arrow onPress={read} />
      </Screen>
    );
  }
  if (summary) return <SummaryView summary={summary} onRead={read} />;

  const cur = quiz.current.current;
  const sm: Summary = quiz.current.summary();
  const done = sm.known.length + sm.unknown.length;
  return (
    <Screen title="Kelime testi">
      <View style={{ gap: 8 }}>
        <Progress value={done / quiz.current.total} />
        <Text style={{ ...styles.muted, fontSize: 13 }}>{done + 1} / {quiz.current.total}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={7} r={22} seed={9} style={{ marginRight: 7, marginBottom: 7, transform: [{ rotate: '-1.5deg' }] }} contentStyle={{ minHeight: 280, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: F.black, fontSize: 56, lineHeight: 62, letterSpacing: -1.8, color: C.ink, textAlign: 'center' }}>{cur.word}</Text>
          {flipped ? (
            <>
              <Squiggle w={120} />
              <Text style={{ ...T.hand, fontSize: 36, lineHeight: 38, color: C.orangeDeep, textAlign: 'center' }}>{meaning === undefined ? '…' : meaning ?? NO_MEANING}</Text>
            </>
          ) : <Text style={{ ...T.hand, fontSize: 25, color: C.muted }}>bu kelimeyi biliyor musun?{'\u00A0'}</Text>}
        </Sticker>
      </View>
      {flipped ? <Btn label="Devam" arrow onPress={() => next(false)} disabled={meaning === undefined} /> : (
        <>
          <Btn label="Biliyorum" arrow onPress={() => next(true)} />
          <Btn label="Bilmiyorum" kind="outline" onPress={dontKnow} />
        </>
      )}
      <Btn label="Testi bitir" kind="ghost" onPress={skip} />
    </Screen>
  );
}

function SummaryView({ summary, onRead }: { summary: Summary; onRead: () => void }) {
  const [tr, setTr] = useState<Record<string, string | null>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { summary.unknown.forEach(w => lookup(w).then(t => setTr(p => ({ ...p, [w]: t })))); }, [summary]);
  const saveAll = async () => {
    for (const w of summary.unknown) await saveWord({ word: w, translation: tr[w] ?? '', from: 'en', to: 'tr', context: '', at: Date.now() });
    setSaved(true);
  };
  return (
    <Screen title="Sonuç">
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
        <Text style={{ fontFamily: F.black, fontSize: 84, lineHeight: 86, letterSpacing: -3, color: C.orange }}>{summary.unknown.length}</Text>
        <Text style={{ ...T.heading, fontSize: 21, lineHeight: 26, paddingBottom: 10, flex: 1 }}>yeni kelime var.{'\n'}<Text style={{ fontFamily: F.serif, color: C.muted }}>{summary.known.length} kelimeyi zaten biliyordun.</Text></Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        {summary.unknown.map(w => (
          <View key={w} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.line }}>
            <Text style={{ fontFamily: F.display, fontSize: 21, color: C.ink }}>{w}</Text>
            <Text style={{ flexShrink: 1, textAlign: 'right', fontFamily: F.uiMed, fontSize: 15, color: C.orangeDeep }}>{w in tr ? tr[w] ?? NO_MEANING : '…'}</Text>
          </View>
        ))}
        <Grain />
      </ScrollView>
      {!!summary.unknown.length && <Btn label={saved ? 'Kaydedildi' : 'Hepsini kaydet'} kind={saved ? 'soft' : 'outline'} icon={saved ? 'check' : undefined} disabled={saved} onPress={saveAll} />}
      <Btn label="Okumaya başla" arrow onPress={onRead} />
    </Screen>
  );
}

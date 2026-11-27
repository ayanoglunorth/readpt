import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { DS } from '../../engine';
import { prepareOnDevice } from '../lookup';
import { setPrefs } from '../store';
import { Sticker } from '../paper';
import { C, F, R, T } from '../theme';
import { Btn, Choice, Progress, Screen, Squiggle, styles } from '../ui';

// UI over DS.placementStart: 50 or fewer word questions (every sixth a non-word), then 15 sentence-completion items.
export default function Placement() {
  const s = useRef<any>(null);
  if (!s.current) s.current = DS.placementStart();
  const [, force] = useState(0);
  useEffect(prepareOnDevice, []); // the test takes minutes: download the translation model meanwhile
  const answer = (v: boolean | number) => { s.current.answer(v); force(x => x + 1); };
  const back = () => { s.current.back(); force(x => x + 1); };
  const it = s.current.current;
  const canBack = s.current.canBack();

  if (s.current.phase === 'done') {
    const level: string = s.current.level;
    return (
      <Screen title="Seviye testi" back={router.canGoBack()}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Text style={{ ...T.hand, fontSize: 28, color: C.orangeDeep }}>seviyen{'\u00A0'}</Text>
          <Text style={{ fontFamily: F.black, fontSize: 120, lineHeight: 124, letterSpacing: -4, color: C.ink }}>{level}</Text>
          <Squiggle w={150} />
          <Text style={{ ...T.heading, fontSize: 22, marginTop: 10 }}>{String(DS.LEVEL_LABELS[DS.LEVELS.indexOf(level)]).split('·')[1]?.trim()}</Text>
        </View>
        <Btn label="Bu seviyeyi kullan" arrow onPress={async () => { await setPrefs({ level, placed: true }); router.replace('/'); }} />
        <Btn label="Testi yeniden yap" kind="ghost" onPress={() => { s.current = DS.placementStart(); force(x => x + 1); }} />
      </Screen>
    );
  }

  const words = s.current.phase === 'words';
  const progress = words ? Math.min(1, s.current.n / 50) * 0.7 : 0.7 + 0.3 * (s.current.n / s.current.clozeTotal);
  return (
    <Screen title="Seviye testi" back={router.canGoBack()}>
      <View style={{ gap: 8 }}>
        <Progress value={progress} />
        <Text style={{ ...styles.muted, fontSize: 13 }}>{words ? `Kelime ${s.current.n + 1}` : `Cümle ${s.current.n + 1} / ${s.current.clozeTotal}`}</Text>
      </View>
      {it.kind === 'cloze' ? (
        <>
          <View style={{ backgroundColor: C.card, borderRadius: R.card, padding: 22 }}>
            <Text style={{ fontFamily: F.serifMed, fontSize: 23, lineHeight: 33, color: C.ink }}>{it.q}</Text>
          </View>
          {it.options.map((o: string, i: number) => <Choice key={i} letter={'ABCD'[i]} label={o} onPress={() => answer(i)} />)}
          <Btn label="Bilmiyorum" kind="ghost" onPress={() => answer(-1)} />
        </>
      ) : (
        <>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={7} r={22} seed={9} style={{ marginRight: 7, marginBottom: 7, transform: [{ rotate: '-1.5deg' }] }} contentStyle={{ minHeight: 260, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: F.black, fontSize: 52, lineHeight: 58, letterSpacing: -1.5, color: C.ink, textAlign: 'center' }}>{it.word}</Text>
              <Text style={{ ...T.hand, fontSize: 25, color: C.orangeDeep }}>bu kelimeyi biliyor musun?{'\u00A0'}</Text>
            </Sticker>
          </View>
          <Btn label="Biliyorum" arrow onPress={() => answer(true)} />
          <Btn label="Bilmiyorum" kind="outline" onPress={() => answer(false)} />
        </>
      )}
      {/* Always laid out, only hidden on the first question: the content must not shift when "Geri" appears. */}
      <View pointerEvents={canBack ? 'auto' : 'none'} accessibilityElementsHidden={!canBack} importantForAccessibility={canBack ? 'auto' : 'no-hide-descendants'} style={{ opacity: canBack ? 1 : 0 }}>
        <Btn label="Geri" kind="ghost" onPress={back} />
      </View>
      <Btn label="Sonra yaparım" kind="ghost" onPress={async () => { await setPrefs({ placed: true }); router.replace('/'); }} />
    </Screen>
  );
}

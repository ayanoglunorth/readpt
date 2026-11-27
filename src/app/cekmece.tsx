import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { DS } from '../../engine';
import { BottomNav } from '../BottomNav';
import { useFocusLoad } from '../hooks';
import { getPrefs, setPrefs, type Prefs } from '../store';
import { Sticker } from '../paper';
import { C, F, READ_THEMES, T } from '../theme';
import { Btn, Chip, Screen, Segmented, styles } from '../ui';

// A section of the drawer: serif title, a handwritten note under it, hairline above (like rows in the notebook).
const Section = ({ title, note, first, children }: { title: string; note?: string; first?: boolean; children: React.ReactNode }) => (
  <View style={{ gap: 14, paddingTop: first ? 0 : 22, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }}>
    <View style={{ gap: 2 }}>
      <Text accessibilityRole="header" style={{ ...T.heading, fontSize: 22 }}>{title}</Text>
      {!!note && <Text style={{ ...T.hand, fontSize: 22, lineHeight: 24, color: C.orangeDeep }}>{note}{'\u00A0'}</Text>}
    </View>
    {children}
  </View>
);

const Label = ({ children }: { children: string }) => <Text style={{ ...T.body, fontSize: 15, color: C.muted }}>{children}</Text>;

export default function Cekmece() {
  const [prefs, ready, reload] = useFocusLoad(getPrefs, null, 'cekmece');
  const change = async (p: Partial<Prefs>) => { await setPrefs(p); reload(); };
  const level = prefs?.level ?? 'A2';
  const levelName = String(DS.LEVEL_LABELS[DS.LEVELS.indexOf(level)] ?? level).split('·')[1]?.trim() ?? level;
  return (
    <Screen title="Çekmece" back={false} scroll tab="cekmece" bottom={<BottomNav active="cekmece" />}>
      {ready && prefs && (
        <>
          <Section first title="Seviyen" note={`${level} · ${levelName}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {DS.LEVELS.map((l: string) => {
                const on = l === level;
                return (
                  <Pressable key={l} accessibilityRole="button" accessibilityLabel={`Seviye ${l}`} accessibilityState={{ selected: on }} onPress={() => change({ level: l })} style={{ marginRight: 3, marginBottom: 3 }}>
                    {({ pressed }) => (
                      <Sticker fill={on ? C.ink : C.paper2} stroke={on ? C.ink : undefined} shadow={on ? C.orange : undefined} off={3} r={26} seed={l.charCodeAt(0) + l.charCodeAt(1)} sw={on ? 2 : 1.5} sunk={pressed}
                        contentStyle={{ width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: F.black, fontSize: 18, letterSpacing: -0.4, color: on ? C.cream : C.muted }}>{l}</Text>
                      </Sticker>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.muted}>Kelime testi, seçtiğin seviyenin üstündeki kelimeleri sorar. Emin değilsen testi yap, biz bulalım.</Text>
            <Btn label="Seviye testi yap" kind="outline" arrow onPress={() => router.push('/placement')} />
          </Section>

          <Section title="Okuma" note="sayfanın görünüşü">
            <View style={{ gap: 8 }}>
              <Label>Yazı boyutu</Label>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {[15, 17, 19, 21, 24].map(sz => (
                  <Pressable key={sz} accessibilityRole="button" accessibilityLabel={`Yazı boyutu ${sz}`} accessibilityState={{ selected: prefs.font === sz }} onPress={() => change({ font: sz })} style={{ marginRight: 3, marginBottom: 3 }}>
                    <Sticker fill={prefs.font === sz ? C.ink : C.paper2} stroke={prefs.font === sz ? C.ink : undefined} shadow={prefs.font === sz ? C.orange : undefined} off={3} r={22} seed={sz} contentStyle={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: F.display, fontSize: sz * 1.1, color: prefs.font === sz ? C.cream : C.ink }}>A</Text>
                    </Sticker>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Label>Sayfa rengi</Label>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {READ_THEMES.map((t, i) => <Chip key={t.name} label={t.name} on={prefs.theme === i} onPress={() => change({ theme: i })} />)}
              </View>
            </View>
          </Section>

          <Section title="Ses" note="telefon sesi okur">
            <View style={{ gap: 8 }}>
              <Label>Okuma hızı</Label>
              <View style={{ alignSelf: 'flex-start' }}><Segmented label="Okuma hızı" value={prefs.rate} onChange={v => change({ rate: v })} options={[0.6, 0.8, 1].map(r => ({ value: r, label: `${r}×` }))} /></View>
            </View>
            <View style={{ gap: 8 }}>
              <Label>Aksan</Label>
              <View style={{ alignSelf: 'flex-start' }}><Segmented label="Aksan" value={prefs.voice ? undefined : prefs.lang} onChange={v => change({ lang: v, voice: undefined })} options={[{ value: 'en-US' as const, label: 'US' }, { value: 'en-GB' as const, label: 'UK' }]} /></View>
            </View>
          </Section>

          <Pressable accessibilityRole="link" onPress={() => router.push('/licenses')} style={{ alignSelf: 'center', paddingVertical: 12 }}>
            <Text style={{ ...T.caption, color: C.muted, textDecorationLine: 'underline' }}>Lisanslar</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

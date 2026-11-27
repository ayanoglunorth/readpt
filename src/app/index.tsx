import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { DS } from '../../engine';
import { useFocusLoad } from '../hooks';
import { useImport } from '../useImport';
import { getBooks, getPos, getPrefs, getWords, setPrefs } from '../store';
import { BottomNav, TabEnter } from '../BottomNav';
import { Icon } from '../Icon';
import { Cover, COVER_RATIO } from '../Cover';
import { Grain, Marked, Sticker } from '../paper';
import { C, F, R, T } from '../theme';
import { Btn, Chip, Heading, IconBtn, Progress, styles } from '../ui';
const FILTERS = [{ v: 'all', label: 'Tümü' }, { v: 'going', label: 'Devam ediyor' }, { v: 'new', label: 'Yeni' }] as const;
const TW = 132;
const COVER_H = Math.round(TW * COVER_RATIO);

export default function Home() {
  const [info] = useFocusLoad(async () => {
    const books = await getBooks();
    const started: Record<string, boolean> = {};
    const page: Record<string, number> = {};
    for (const b of books) { const p = await getPos(b.id); started[b.id] = p.page > 1 || p.para > 0; page[b.id] = p.page; }
    const words = await getWords();
    return { books, started, page, prefs: await getPrefs(), words: words.length, due: words.filter(w => (w.due ?? 0) <= Date.now()).length };
  }, null, 'home');
  // First launch: the level test comes first (it can be skipped there).
  useEffect(() => { getPrefs().then(p => { if (!p.placed) router.replace('/placement'); }); }, []);
  const insets = useSafeAreaInsets();
  const { job, msg, pick, cancel, extractor } = useImport();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['v']>('all');
  const [lvl, setLvl] = useState<string | null>(null);

  const level = lvl ?? info?.prefs.level ?? 'A2';
  const chooseLevel = (l: string) => { setLvl(l); setPrefs({ level: l }); };
  const all = info?.books ?? [];
  const books = all.filter(b => filter === 'all' || (filter === 'going') === !!info?.started[b.id]);
  const going = [...all].filter(b => info?.started[b.id]).sort((a, b) => b.at - a.at)[0];
  const levelName = String(DS.LEVEL_LABELS[DS.LEVELS.indexOf(level)] ?? level).split('·')[1]?.trim() ?? level;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <TabEnter tab="home">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 36 }}>
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: F.displayIt, fontSize: 26, letterSpacing: -0.6, color: C.ink }}>readpt<Text style={{ color: C.orange }}>.</Text></Text>
          <IconBtn icon="filePlus" label="PDF ekle" disabled={!!job} onPress={() => pick()} />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 26, gap: 6 }}>
          <Text style={{ ...T.display, color: C.ink }}>Bugün ne</Text>
          <Marked style={{ ...T.display, color: C.ink }}>okuyoruz?</Marked>
          {job ? (
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={styles.muted}>“{job.title}” okunuyor {job.total ? `${job.n} / ${job.total}` : '…'}</Text>
              <Progress value={job.total ? job.n / job.total : 0} />
              <Btn label="İptal" kind="ghost" onPress={cancel} style={{ alignSelf: 'flex-start' }} />
            </View>
          ) : !!msg && <Text style={{ ...styles.muted, color: C.danger }}>{msg}</Text>}
        </View>

        {going && (
          <Pressable accessibilityRole="button" accessibilityLabel={`${going.title}, okumaya devam et`} onPress={() => router.push(`/book/${going.id}`)} style={{ marginHorizontal: 20, marginTop: 34 }}>
            {({ pressed }) => (
              <Sticker fill={C.forest} stroke={C.ink} shadow={C.orange} off={6} r={26} seed={4} sunk={pressed} style={{ marginRight: 6, marginBottom: 6 }} contentStyle={{ padding: 18, flexDirection: 'row', gap: 18, alignItems: 'center' }}>
                <Cover id={going.id} title={going.title} w={96} tilt={-4} lift />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontFamily: F.hand, fontSize: 24, lineHeight: 24, color: C.butter }}>kaldığın yer{'\u00A0'}</Text>
                  <Text numberOfLines={3} style={{ ...T.heading, fontSize: 21, lineHeight: 24, color: C.cream }}>{going.title}</Text>
                  <Progress value={(info?.page[going.id] ?? 1) / going.pages} color={C.butter} track="rgba(253,246,230,0.22)" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ ...T.caption, color: 'rgba(253,246,230,0.78)' }}>Sayfa {info?.page[going.id]} / {going.pages}</Text>
                    <View style={{ flex: 1 }} />
                    <Icon name="arrowR" bold size={20} color={C.butter} />
                  </View>
                </View>
                {/* the bookmark ribbon hanging off the card's top edge */}
                <Svg pointerEvents="none" width={26} height={50} viewBox="0 0 26 50" style={{ position: 'absolute', top: -3, right: 24 }}>
                  <Path d="M2 0V46L13 38L24 46V0" fill={C.orange} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
                </Svg>
              </Sticker>
            )}
          </Pressable>
        )}

        <View style={{ paddingHorizontal: 20, gap: 14, marginTop: 38 }}>
          <Heading>Rafın</Heading>
          {!!all.length && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FILTERS.map(f => <Chip key={f.v} label={f.label} on={filter === f.v} onPress={() => setFilter(f.v)} />)}
            </View>
          )}
        </View>

        {info && !all.length ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, gap: 8 }}>
            <View style={{ width: 330, height: 232 }} accessible={false}>
              <View style={{ position: 'absolute', left: 0, top: 44 }}><Cover id="demo-a" title="Yeni Sayfalar" w={98} tilt={-7} /></View>
              <View style={{ position: 'absolute', right: 0, top: 40 }}><Cover id="demo-b" title="Bir Başka Gün" w={98} tilt={7} /></View>
              <View style={{ position: 'absolute', left: 100, top: 0 }}><Cover id="demo-c" title="İlk Kitap" w={130} lift /></View>
            </View>
            <Text style={{ ...T.hand, fontSize: 26, color: C.orangeDeep, transform: [{ rotate: '-2deg' }] }}>rafın henüz boş{'\u00A0'}</Text>
            <Text style={{ ...styles.muted, textAlign: 'center', marginBottom: 12 }}>Metni seçilebilen bir PDF ekle. Okurken bilmediğin kelimeye dokun, anlamı ve sesi hemen gelsin.</Text>
            <Btn label="PDF ekle" arrow onPress={() => pick()} disabled={!!job} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 4, gap: 18 }}>
            {/* the plank the books stand on */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 22 + COVER_H + 2, height: 12, backgroundColor: C.ink, borderRadius: 3 }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 22 + COVER_H + 14, height: 6, backgroundColor: C.paper2 }} />
            {books.map((b, i) => (
              <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={b.title} onPress={() => router.push(`/book/${b.id}`)} style={({ pressed }) => ({ width: TW, opacity: pressed ? 0.85 : 1 })}>
                <Cover id={b.id} title={b.title} w={TW} tilt={i % 2 ? 1.5 : -1.5} lift />
                <View style={{ gap: 5, marginTop: 24 }}>
                  <Text numberOfLines={2} style={{ ...T.heading, fontSize: 16, lineHeight: 20 }}>{b.title}</Text>
                  <Text style={{ ...T.caption, color: C.muted }}>{info?.started[b.id] ? `Sayfa ${info.page[b.id]} / ${b.pages}` : `${b.pages} sayfa · yeni`}</Text>
                </View>
              </Pressable>
            ))}
            {!!all.length && filter === 'all' && (
              <Pressable accessibilityRole="button" accessibilityLabel="PDF ekle" disabled={!!job} onPress={() => pick()} style={{ width: TW }}>
                <View style={{ width: TW, height: COVER_H, borderRadius: 8, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="plus" bold size={28} color={C.ink} />
                  <Text style={{ ...T.hand, fontSize: 22, color: C.ink }}>yeni kitap{'\u00A0'}</Text>
                </View>
              </Pressable>
            )}
            {!!all.length && !books.length && <Text style={{ ...styles.muted, paddingVertical: 40 }}>Bu filtrede kitap yok.</Text>}
          </ScrollView>
        )}

        {!!info?.words && (
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/words')} style={{ marginHorizontal: 20, marginTop: 34 }}>
            {({ pressed }) => (
              <Sticker fill={C.butter} stroke={C.ink} shadow={C.ink} off={5} r={R.card} seed={6} sunk={pressed} style={{ marginRight: 5, marginBottom: 5 }} contentStyle={{ paddingVertical: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...T.heading, fontSize: 18 }}>{info.words} kelime defterinde</Text>
                  <Text style={{ ...T.hand, fontSize: 24, lineHeight: 25, color: C.ink }}>{info.due ? `${info.due} tanesi tekrar bekliyor` : 'bugün tekrar yok'}{'\u00A0'}</Text>
                </View>
                <Icon name="arrowR" bold size={24} color={C.ink} />
              </Sticker>
            )}
          </Pressable>
        )}

        <View style={{ paddingHorizontal: 20, gap: 16, marginTop: 38 }}>
          <Heading>Seviyen</Heading>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {DS.LEVELS.map((l: string) => {
              const on = l === level;
              return (
                <Pressable key={l} accessibilityRole="button" accessibilityLabel={`Seviye ${l}`} accessibilityState={{ selected: on }} onPress={() => chooseLevel(l)} style={{ marginRight: 3, marginBottom: 3 }}>
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
          <Text style={{ ...T.hand, fontSize: 26, color: C.orangeDeep }}>{level} · {levelName}{'\u00A0'}</Text>
          <Text style={styles.muted}>Test, seçtiğin seviyenin üstündeki kelimeleri sorar.</Text>
          <Btn label="Seviye testi yap" kind="outline" arrow onPress={() => router.push('/placement')} />
          <Pressable accessibilityRole="link" onPress={() => router.push('/licenses')} style={{ alignSelf: 'center', paddingVertical: 12 }}>
            <Text style={{ ...T.caption, color: C.muted, textDecorationLine: 'underline' }}>Lisanslar</Text>
          </Pressable>
        </View>
        <Grain />
      </ScrollView>
      </TabEnter>
      <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
        {extractor}
      </View>
      <BottomNav active="home" due={info?.due ?? 0} />
    </View>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../../engine';
import { deletePages } from '../../bookFiles';
import { Cover, toneOf } from '../../Cover';
import { useFocusLoad } from '../../hooks';
import { getBooks, getPos, getPrefs, removeBook, setBookTr, storage } from '../../store';
import { useImport } from '../../useImport';
import Svg, { Path } from 'react-native-svg';
import { Grain, tornPath } from '../../paper';
import { C, F, T } from '../../theme';
import { RangePicker } from '../../RangePicker';
import { Btn, Chip, IconBtn, Progress, Screen, styles } from '../../ui';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [data, ready, reload] = useFocusLoad(async () => ({ book: (await getBooks()).find(b => b.id === id) ?? null, pos: await getPos(id), level: (await getPrefs()).level }), null);
  const imp = useImport(reload);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [n, setN] = useState(20);
  const [sure, setSure] = useState(false);
  if (!ready || !data) return <Screen title="Kitap"><Text style={styles.muted}>…</Text></Screen>;
  const { book, pos, level } = data;
  if (!book) return <Screen title="Kitap"><Text style={styles.body}>Kitap bulunamadı.</Text></Screen>;
  const resume = Math.min(pos.page, book.pages);
  const start = from ?? resume;
  // Both ends are inclusive; the range is capped at 50 pages so the test stays short.
  const [a, b] = DS.clampRange(start, to ?? start + 2, book.pages, 50);
  const added = new Date(book.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const tone = toneOf(book.id);
  const field = tone.accent; // contrasts with the cover's own pigment
  const dark = [C.ink, C.forest, C.forestDeep, C.orangeDeep].includes(field);
  const stat = (v: string | number, l: string) => (
    <View key={l} style={{ gap: 0 }}>
      <Text style={{ fontFamily: F.black, fontSize: 30, lineHeight: 32, letterSpacing: -0.8, color: C.ink }}>{v}</Text>
      <Text style={{ ...T.caption, color: C.muted }}>{l}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: field }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ paddingTop: insets.top + 10, alignItems: 'center', paddingBottom: 44 }}>
          <View style={{ alignSelf: 'stretch', paddingHorizontal: 16 }}>
            <IconBtn icon="arrowL" label="Geri" tone={dark ? 'light' : 'dark'} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          </View>
          <View style={{ marginTop: 8 }}><Cover id={book.id} title={book.title} w={172} tilt={-3} lift /></View>
        </View>

        <Svg width="100%" height={16} viewBox="0 0 375 16" preserveAspectRatio="none" style={{ marginTop: -15 }}><Path d={tornPath(375, 16, 8, 9)} fill={C.paper} /></Svg>
        <View style={{ backgroundColor: C.paper, paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 40, gap: 22, flexGrow: 1 }}>
          <View style={{ gap: 6 }}>
            <Text numberOfLines={4} style={{ ...T.title, fontSize: 32, lineHeight: 35 }}>{book.title}</Text>
            <Text style={{ ...T.hand, fontSize: 22, color: C.orangeDeep }}>{added} tarihinde eklendi · seviye {level}{'\u00A0'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-end' }}>
            {stat(book.pages, 'sayfa')}{stat(book.textPages, 'metinli')}{stat(resume, 'kaldığın')}
          </View>
          <Progress value={resume / book.pages} />

          <Text accessibilityRole="header" style={{ ...T.title, fontSize: 24, marginTop: 8 }}>Bugünkü sayfalar</Text>
          <RangePicker pages={book.pages} resume={resume} from={a} to={b} onChange={(x, y) => { setFrom(x); setTo(y); }} />
          <View style={{ gap: 10 }}>
            <Text style={{ ...styles.muted }}>En çok kaç soru?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[10, 20, 30, 50].map(k => <Chip key={k} label={String(k)} on={n === k} onPress={() => setN(k)} />)}
            </View>
          </View>
          <View style={{ gap: 10 }}>
            <Btn label="Kelime testini başlat" arrow onPress={() => router.push({ pathname: '/quiz', params: { id, from: String(a), to: String(b), n: String(n) } })} />
            <Btn label={`Doğrudan oku · sayfa ${resume}`} kind="soft" icon="read" onPress={() => router.push(`/read/${id}`)} />
          </View>
          {imp.job ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.muted}>Türkçe PDF okunuyor {imp.job.total ? `${imp.job.n} / ${imp.job.total}` : '…'}</Text>
              <Progress value={imp.job.total ? imp.job.n / imp.job.total : 0} />
              <Btn label="İptal" kind="ghost" onPress={imp.cancel} />
            </View>
          ) : book.tr ? (
            <View style={{ gap: 4 }}>
              <Text style={styles.muted}>Türkçe PDF eşlendi · {book.tr.pages} sayfa. Okurken İngilizce ve Türkçe arasında geçebilirsin.</Text>
              <Btn label="Türkçe PDF'i kaldır" kind="ghost" onPress={async () => { await deletePages(book.tr!.id); await setBookTr(id, null); reload(); }} />
            </View>
          ) : <Btn label="Türkçe PDF ekle" kind="ghost" icon="filePlus" onPress={() => imp.pick(id)} />}
          {!!imp.msg && <Text style={{ ...styles.muted, color: C.danger }}>{imp.msg}</Text>}
          <View style={{ height: 0, width: 0, overflow: 'hidden' }}>{imp.extractor}</View>
          {sure ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn label="Vazgeç" kind="soft" style={{ flex: 1 }} onPress={() => setSure(false)} />
              <Btn label="Evet, sil" kind="danger" style={{ flex: 1 }} onPress={async () => { await deletePages(id); if (book.tr) await deletePages(book.tr.id); await removeBook(id); await storage.remove('pos:' + id); router.replace('/'); }} />
            </View>
          ) : <Btn label="Kitabı sil" kind="ghost" icon="trash" onPress={() => setSure(true)} />}
        </View>
        <Grain />
      </ScrollView>
    </View>
  );
}

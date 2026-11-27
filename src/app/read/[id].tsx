import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { Platform, Pressable, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { DS } from '../../../engine';
import { loadPages, pdfUri } from '../../bookFiles';
import PdfPageView from '../../pdf/PdfPageView';
import { lookup } from '../../lookup';
import { DEFAULT_PREFS, addVocab, getBooks, getPos, getPrefs, saveWord, setBookTr, setPos, setPrefs, type Book, type Prefs } from '../../store';
import { Icon } from '../../Icon';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { C, F, R, READ_THEMES, T } from '../../theme';
import { speak, stop } from '../../tts';
import { Grain, Sticker } from '../../paper';
import { Slider } from '../../Slider';
import { Btn, Chip, IconBtn, NumField, Segmented, styles } from '../../ui';

const LEADING = [1.4, 1.62, 1.9];
type Hl = { para: number; start: number; len: number } | null;
type Sel = { word: string; context: string };

export default function Reader() {
  const { id, page: startPage } = useLocalSearchParams<{ id: string; page?: string }>();
  const insets = useSafeAreaInsets();
  const [pages, setPages] = useState<string[][] | null>(null);
  const [page, setPage] = useState(1);
  const [para, setPara] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const [jumpTo, setJumpTo] = useState(1);
  const [tr, setTr] = useState<Book['tr']>(undefined); // the paired Turkish PDF, if the book has one
  const [trPages, setTrPages] = useState<string[][] | null>(null);
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [playing, setPlaying] = useState(false);
  const [hl, setHl] = useState<Hl>(null);
  const [sel, setSel] = useState<Sel | null>(null);
  const [meaning, setMeaning] = useState<string | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [showVoices, setShowVoices] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<'text' | 'page'>('text'); // text: reflowed words; page: the PDF page as printed
  const [voices, setVoices] = useState<{ identifier: string; label: string }[]>([]);

  const scroll = useRef<ScrollViewInstance>(null);
  const ys = useRef<number[]>([]);
  const startPara = useRef(0);
  const restored = useRef(false);
  const live = useRef({ page: 1, prefs: DEFAULT_PREFS, pages: null as string[][] | null });
  live.current = { page, prefs, pages };

  useEffect(() => {
    (async () => {
      const [p, pos, pr] = await Promise.all([loadPages(id), getPos(id), getPrefs()]);
      const asked = Number(startPage);
      startPara.current = asked ? 0 : pos.para;
      setPara(startPara.current);
      const t = (await getBooks()).find(b => b.id === id)?.tr;
      setTr(t);
      setTrPages(t ? await loadPages(t.id) : null);
      setPrefsState(pr);
      setPages(p);
      setPage(Math.max(1, Math.min(asked || pos.page, p?.length ?? 1)));
    })();
    return () => stop();
  }, [id, startPage]);

  // pgOverride: the page just turned to by audio, before React has re-rendered it into live.current.
  const speakPara = useCallback((i: number, pgOverride?: number) => {
    const { page: current, prefs: pr, pages: ps } = live.current;
    const pg = pgOverride ?? current;
    const paras = ps?.[pg - 1] ?? [];
    if (i >= paras.length) {
      // Page finished: carry on at the next page that has text, or stop at the end of the book.
      const next = (ps ?? []).findIndex((p, k) => k >= pg && p.length);
      if (next < 0) { setPlaying(false); setHl(null); return; }
      ys.current = []; restored.current = true; setPage(next + 1); setPara(0); setSel(null);
      speakPara(0, next + 1);
      return;
    }
    setPlaying(true); setHl({ para: i, start: -1, len: 0 });
    startPara.current = i;
    setPos(id, { page: pg, para: i });
    scroll.current?.scrollTo({ y: Math.max(0, (ys.current[i] ?? 0) - 16), animated: true });
    speak(paras[i], {
      lang: pr.lang, rate: pr.rate, voice: pr.voice,
      onBoundary: (start, len) => setHl({ para: i, start, len }),
      onDone: () => speakPara(i + 1, pg),
      onStop: () => { setPlaying(false); setHl(null); },
    });
  }, [id]);

  const pause = () => { stop(); setPlaying(false); setHl(null); };
  const goTo = (n: number) => {
    if (!pages || n < 1 || n > pages.length) return;
    pause(); setSel(null);
    ys.current = []; restored.current = true; startPara.current = 0;
    setPage(n); setPara(0); setPos(id, { page: n, para: 0 });
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const openVoices = async () => {
    setShowVoices(s => !s);
    if (voices.length) return;
    const good = (v: Speech.Voice) => v.quality === Speech.VoiceQuality.Enhanced;
    // Enhanced (higher quality) voices first, marked with ★.
    const all = (await Speech.getAvailableVoicesAsync()).filter(v => v.language.toLowerCase().startsWith('en'))
      .sort((a, b) => Number(good(b)) - Number(good(a)));
    // Android names are codes like "en-us-x-sfg#male_1-local", so show "en-US 1" there; iOS names are real ("Samantha").
    const n: Record<string, number> = {};
    setVoices(all.map(v => ({ identifier: v.identifier, label: (good(v) ? '★ ' : '') + (Platform.OS === 'ios' ? v.name : `${v.language} ${(n[v.language] = (n[v.language] ?? 0) + 1)}`) })));
  };
  const change = async (p: Partial<Prefs>) => { setPrefsState(x => ({ ...x, ...p })); await setPrefs(p); };

  const choose = (word: string, context: string) => {
    pause();
    setSel({ word, context }); setMeaning(undefined); setSaved(false);
    lookup(word, true).then(setMeaning);
    speak(word, { lang: live.current.prefs.lang, rate: 0.7, voice: live.current.prefs.voice });
  };
  const save = async () => {
    if (!sel) return;
    const w = sel.word.toLowerCase();
    await saveWord({ word: w, translation: meaning ?? '', from: 'en', to: 'tr', context: sel.context, at: Date.now() });
    await addVocab({ [DS.bookHeadword(w)?.word ?? w]: 'l' });
    setSaved(true);
  };

  const pdfId = lang === 'tr' && tr && trPages ? tr.id : id;
  const pdf = useMemo(() => pdfUri(pdfId), [pdfId]); // the stored PDF for the page view; null for a book imported before PDFs were kept
  const th = READ_THEMES[prefs.theme] ?? READ_THEMES[0];
  const night = prefs.theme === 2;
  if (!pages) return <View style={{ flex: 1, backgroundColor: th.bg }} />;
  // Turkish view: the matching page of the other PDF; words are not tappable and there is no audio.
  const inTr = lang === 'tr' && !!tr && !!trPages;
  const shownPage = inTr ? DS.pairedPage(page, tr!.offset, tr!.pages) : page;
  const paras = (inTr ? trPages![shownPage - 1] : pages[page - 1]) ?? [];
  const setLangTo = (l: 'en' | 'tr') => { if (l === lang) return; pause(); setSel(null); ys.current = []; setPara(0); setLang(l); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const setOffset = async (offset: number) => { if (!tr) return; setTr({ ...tr, offset }); await setBookTr(id, { ...tr, offset }); };
  const f = prefs.font;
  const marked = hl?.para ?? para; // the paragraph the eye should be on: the one being read aloud, else the one at the top
  const bg = th.bg;
  const readFrom = () => speakPara(Math.min(startPara.current, Math.max(0, paras.length - 1)));
  const play = () => {
    if (inTr) return;
    if (playing) return pause();
    if (mode === 'page') { setMode('text'); setTimeout(readFrom, 80); return; } // the paragraphs must be on screen first
    readFrom();
  };
  const garbled = DS.garbled(paras); // the PDF's fonts have no Unicode map: the text came out as symbols
  const toggle = (label: string, on: boolean, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
      style={{ borderRadius: 999, paddingHorizontal: 18, height: 38, justifyContent: 'center', backgroundColor: on ? th.bar : 'transparent' }}>
      <Text style={{ fontFamily: F.uiSemi, fontSize: 14, color: on ? th.barInk : th.mute }}>{label}</Text>
    </Pressable>
  );
  const hold = (icon: 'chevL' | 'chevR' | 'textSize' | 'arrowL', label: string, onPress: () => void, disabled?: boolean, on?: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, expanded: on }} disabled={disabled} onPress={onPress} style={{ opacity: disabled ? 0.3 : 1, marginRight: 3, marginBottom: 3 }}>
      {({ pressed }) => (
        <Sticker fill={on ? th.ink : th.bg} stroke={th.ink} shadow={th.ink} off={3} r={24} seed={icon.length + 2} sw={1.8} sunk={pressed} contentStyle={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} bold color={on ? th.bg : th.ink} />
        </Sticker>
      )}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <StatusBar style={night ? 'light' : 'dark'} />
      <View style={{ height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        {hold('arrowL', 'Geri', () => (router.canGoBack() ? router.back() : router.replace('/')))}
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', backgroundColor: night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderRadius: 999, padding: 3 }}>
          {toggle('Sesli', playing, () => !playing && play())}
          {toggle('Metin', !playing && mode === 'text', () => { pause(); setMode('text'); })}
          {toggle('Sayfa', mode === 'page', () => { pause(); setMode('page'); })}
        </View>
        {hold('textSize', 'Okuma ayarları', () => setShowSettings(s => !s), false, showSettings)}
      </View>
      {!!tr && !!trPages && (
        <View accessibilityRole="radiogroup" style={{ alignSelf: 'center', flexDirection: 'row', backgroundColor: night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderRadius: 999, padding: 3 }}>
          {toggle('English', !inTr, () => setLangTo('en'))}
          {toggle('Türkçe', inTr, () => setLangTo('tr'))}
        </View>
      )}
      <View style={{ flex: 1 }}>
        {mode === 'page' ? (
          pdf ? <PdfPageView uri={pdf} page={shownPage} bg={bg} /> : (
            <Text style={{ ...T.body, color: th.mute, textAlign: 'center', padding: 32 }}>Bu kitabın PDF’i kayıtlı değil. Rafta “PDF ekle” ile aynı dosyayı bir kez daha seçin, sayfa görünümü açılır.</Text>
          )
        ) : <>
        <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 10, gap: 20, paddingBottom: 130 }} scrollEventThrottle={250}
          onContentSizeChange={() => {
            if (restored.current) return;
            restored.current = true;
            const y = ys.current[startPara.current];
            if (y && startPara.current > 0) scroll.current?.scrollTo({ y: Math.max(0, y - 16), animated: false });
          }}
          onScroll={e => {
            if (playing) return;
            const y = e.nativeEvent.contentOffset.y + 40;
            const p = DS.paraAt(ys.current, y);
            startPara.current = p;
            setPara(p);
            if (!inTr) setPos(id, { page, para: p }); // paragraph numbers do not carry over between languages
          }}>
          {garbled && (
            <View style={{ gap: 12, alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ ...T.body, color: th.mute, textAlign: 'center' }}>Bu sayfanın metni okunamadı: PDF’in yazı tipi harf bilgisi taşımıyor.{pdf ? ' Sayfayı olduğu gibi görebilirsin.' : ''}</Text>
              {!!pdf && <Btn label="Sayfayı göster" kind="outline" onPress={() => { pause(); setMode('page'); }} />}
            </View>
          )}
          {!paras.length && !garbled && <Text style={{ ...T.body, color: th.mute, textAlign: 'center' }}>Bu sayfada metin yok.</Text>}
          {!garbled && paras.map((p, i) => (
            <Text key={lang + page + ':' + i} onLayout={e => { ys.current[i] = e.nativeEvent.layout.y; }}
              style={{ fontSize: f, lineHeight: f * LEADING[prefs.leading], textAlign: prefs.align, fontFamily: F.serif, color: th.ink, opacity: prefs.dim, backgroundColor: hl?.para === i ? (night ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : undefined, borderLeftWidth: 3, borderLeftColor: marked === i ? C.orange : 'transparent', paddingLeft: 10, marginLeft: -13, paddingTop: i === 0 && !inTr ? f * 0.7 : 0 }}>
              {inTr ? p : DS.segments(p).map((s: { text: string; word: boolean; start: number }) => {
                const on = hl?.para === i && s.word && hl.len > 0 && s.start >= hl.start && s.start < hl.start + hl.len;
                return s.word
                  ? <Text key={s.start} onPress={() => choose(s.text, DS.sentenceAt(p, s.start))} style={on ? { backgroundColor: th.hi, color: night ? '#fff' : C.ink } : undefined}>
                    {i === 0 && s.start === 0 ? <Text style={{ fontSize: f * 2, lineHeight: f * LEADING[prefs.leading], fontFamily: F.black, color: th.cap }}>{s.text[0]}</Text> : s.text[0]}{s.text.slice(1)}
                  </Text>
                  : <Text key={s.start}>{s.text}</Text>;
              })}
            </Text>
          ))}
          <Grain />
        </ScrollView>
        <Svg width="100%" height={110} preserveAspectRatio="none" pointerEvents="none" style={{ position: 'absolute', bottom: 0 }}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={bg} stopOpacity="0" />
              <Stop offset="1" stopColor={bg} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fade)" />
        </Svg>
        </>}
      </View>

      {sel && (
        <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={5} r={R.sheet} seed={31} style={{ marginHorizontal: 14, marginBottom: 10, marginRight: 19 }} contentStyle={{ padding: 18, gap: 10 }}>
          <Text style={{ fontFamily: F.black, fontSize: 32, lineHeight: 36, letterSpacing: -1, color: C.ink }}>{sel.word}</Text>
          <Text style={{ fontFamily: F.hand, fontSize: 30, lineHeight: 32, color: C.orangeDeep }}>{meaning === undefined ? '…' : meaning ?? 'Anlam bulunamadı'}</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <Btn label={saved ? 'Kaydedildi' : 'Kaydet'} kind={saved ? 'soft' : 'primary'} icon={saved ? 'check' : undefined} disabled={saved || meaning === undefined} onPress={save} style={{ flex: 1 }} />
            <IconBtn icon="sound" label="Dinle" size={56} onPress={() => speak(sel.word, { lang: prefs.lang, rate: 0.7, voice: prefs.voice })} />
            <IconBtn icon="close" label="Kapat" size={56} onPress={() => { setSel(null); stop(); }} />
          </View>
        </Sticker>
      )}

      {showJump && (
        <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={5} r={R.sheet} seed={32} style={{ marginHorizontal: 14, marginBottom: 10, marginRight: 19 }} contentStyle={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NumField label="Sayfa" value={jumpTo} min={1} max={pages.length} onChange={setJumpTo} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row' }}><Slider label="Sayfa" value={jumpTo} min={1} max={pages.length} onChange={v => setJumpTo(Math.round(v))} /></View>
              <Text style={{ ...T.caption, color: C.muted }}>toplam {pages.length} sayfa</Text>
            </View>
          </View>
          <Btn label={`Sayfa ${jumpTo}'e git`} arrow onPress={() => { goTo(jumpTo); setShowJump(false); }} />
        </Sticker>
      )}

      {showSettings && (
        <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={5} r={R.sheet} seed={33} style={{ marginHorizontal: 14, marginBottom: 10, marginRight: 19 }} contentStyle={{ padding: 18, gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="sunLow" size={22} color={C.ink} />
            <Slider label="Metin parlaklığı" value={prefs.dim} min={0.45} max={1} onChange={v => change({ dim: v })} />
            <Icon name="sun" size={26} color={C.ink} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {READ_THEMES.map((t, i) => (
              <Pressable key={t.name} accessibilityRole="button" accessibilityLabel={`${t.name} teması`} accessibilityState={{ selected: prefs.theme === i }} onPress={() => change({ theme: i })}
                style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Sticker fill={t.bg} stroke={C.ink} shadow={prefs.theme === i ? C.orange : undefined} off={3} r={28} seed={i + 40} sw={prefs.theme === i ? 2.4 : 1.5} contentStyle={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: F.display, fontSize: 20, color: t.ink }}>Aa</Text>
                </Sticker>
                <Text style={{ fontFamily: F.uiMed, fontSize: 12, color: prefs.theme === i ? C.ink : C.muted }}>{t.name}</Text>
              </Pressable>
            ))}
          </View>
          {!!tr && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ ...T.body, fontSize: 15, color: C.muted }}>Türkçe sayfa farkı</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <IconBtn icon="minus" label="Farkı azalt" onPress={() => setOffset(Math.max(-50, tr.offset - 1))} />
                <Text style={{ fontFamily: F.black, fontSize: 24, minWidth: 36, textAlign: 'center', color: C.ink }}>{tr.offset}</Text>
                <IconBtn icon="plus" label="Farkı artır" onPress={() => setOffset(Math.min(50, tr.offset + 1))} />
              </View>
            </View>
          )}
          <View style={{ gap: 8 }}>
            <Text style={{ ...T.body, fontSize: 15, color: C.muted }}>Yazı boyutu</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              {[15, 17, 19, 21, 24].map(sz => (
                <Pressable key={sz} accessibilityRole="button" accessibilityLabel={`Yazı boyutu ${sz}`} accessibilityState={{ selected: f === sz }} onPress={() => change({ font: sz })} style={{ marginRight: 3, marginBottom: 3 }}>
                  <Sticker fill={f === sz ? C.ink : C.paper2} stroke={f === sz ? C.ink : undefined} shadow={f === sz ? C.orange : undefined} off={3} r={22} seed={sz} contentStyle={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: F.display, fontSize: sz * 1.1, color: f === sz ? C.cream : C.ink }}>A</Text>
                  </Sticker>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {([['left', 'alignLeft', 'Sola yasla'], ['justify', 'alignJustify', 'İki yana yasla']] as const).map(([v, ic, lb]) => (
                <Pressable key={v} accessibilityRole="button" accessibilityLabel={lb} accessibilityState={{ selected: prefs.align === v }} onPress={() => change({ align: v })}
                  style={{ width: 48, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: prefs.align === v ? C.ink : 'transparent' }}>
                  <Icon name={ic} size={22} color={prefs.align === v ? C.cream : C.muted} />
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {([['leadTight', 'Sık satır aralığı'], ['leadNormal', 'Normal satır aralığı'], ['leadLoose', 'Geniş satır aralığı']] as const).map(([ic, lb], i) => (
                <Pressable key={ic} accessibilityRole="button" accessibilityLabel={lb} accessibilityState={{ selected: prefs.leading === i }} onPress={() => change({ leading: i })}
                  style={{ width: 48, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: prefs.leading === i ? C.ink : 'transparent' }}>
                  <Icon name={ic} size={22} color={prefs.leading === i ? C.cream : C.muted} />
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <Segmented label="Okuma hızı" value={prefs.rate} onChange={v => change({ rate: v })} options={[0.6, 0.8, 1].map(r => ({ value: r, label: `${r}×` }))} />
            <Segmented label="Aksan" value={prefs.voice ? undefined : prefs.lang} onChange={v => change({ lang: v, voice: undefined })} options={[{ value: 'en-US' as const, label: 'US' }, { value: 'en-GB' as const, label: 'UK' }]} />
            <IconBtn icon="sound" label="Ses seç" tone={showVoices ? 'dark' : 'soft'} onPress={openVoices} />
          </View>
          {showVoices && (
            <ScrollView style={{ maxHeight: 132 }} contentContainerStyle={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {!voices.length && <Text style={styles.body}>Bu telefonda İngilizce ses bulunamadı.</Text>}
              {voices.map(v => (
                <Chip key={v.identifier} label={v.label} on={prefs.voice === v.identifier}
                  onPress={() => { change({ voice: v.identifier }); speak('Hello, this is my voice.', { lang: prefs.lang, rate: prefs.rate, voice: v.identifier }); }} />
              ))}
            </ScrollView>
          )}
        </Sticker>
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Sayfaya git" onPress={() => { setJumpTo(page); setShowJump(v => !v); }} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: F.uiSemi, fontSize: 13, color: th.mute }}>{inTr ? `Türkçe · sayfa ${shownPage} / ${tr!.pages}` : `Sayfa ${page} / ${pages.length}`} · sayfaya git</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingBottom: insets.bottom + 10, paddingTop: 4 }}>
        {hold('chevL', 'Önceki sayfa', () => goTo(page - 1), page <= 1)}
        <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Durdur' : 'Sesli oku'} onPress={play} style={{ flex: 1, marginRight: 5, marginBottom: 5 }}>
          {({ pressed }) => (
            <Sticker fill={th.bar} stroke={th.bar} shadow={night ? C.cream : C.orange} off={5} r={29} seed={12} sunk={pressed} contentStyle={{ height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
              <Icon name={playing ? 'pause' : 'play'} size={20} color={night ? C.ink : C.orange} />
              <Text style={{ fontFamily: F.hand, fontSize: 25, lineHeight: 28, color: th.barInk }}>{playing ? 'Durdur' : 'Sesli oku'}{'\u00A0'}</Text>
            </Sticker>
          )}
        </Pressable>
        {hold('chevR', 'Sonraki sayfa', () => goTo(page + 1), page >= pages.length)}
      </View>
    </View>
  );
}

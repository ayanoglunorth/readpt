import { useMemo, useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Icon } from './Icon';
import { cutPath } from './paper';
import { C, F, T } from './theme';
import { Chip, NumField } from './ui';

const PRESETS = [3, 5, 10, 20];

// Picks an inclusive page range. Three ways in, so nobody has to fiddle a thumb along a bar:
// type the two numbers, tap a length preset, or touch the page map (the whole book as one strip) to move the range there.
export function RangePicker({ pages, resume, from, to, cap = 50, onChange }: { pages: number; resume: number; from: number; to: number; cap?: number; onChange: (from: number, to: number) => void }) {
  const [w, setW] = useState(0);
  const span = to - from + 1;
  const setStart = (a: number) => { const s = Math.min(span, pages); const st = Math.max(1, Math.min(pages - s + 1, a)); onChange(st, st + s - 1); };
  const setLen = (k: number) => onChange(from, Math.min(pages, from + k - 1));
  const touch = (e: GestureResponderEvent) => setStart(Math.round((e.nativeEvent.locationX / Math.max(1, w)) * pages - span / 2) + 1);
  const x = (p: number) => ((p - 1) / pages) * w;
  const d = useMemo(() => (w ? { track: cutPath(w, 22, 11, 21, 1), read: cutPath(Math.max(22, x(resume + 1)), 22, 11, 22, 1) } : null), [w, resume, pages]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <NumField label="İlk sayfa" value={from} min={1} max={pages} onChange={a => onChange(a, Math.min(pages, to < a ? a : Math.min(to, a + cap - 1)))} />
          <Text style={{ ...T.caption, color: C.muted }}>ilk sayfa</Text>
        </View>
        <View style={{ marginBottom: 18 }}><Icon name="arrowR" bold size={28} color={C.orange} /></View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <NumField label="Son sayfa" value={to} min={from} max={Math.min(pages, from + cap - 1)} onChange={b => onChange(from, b)} />
          <Text style={{ ...T.caption, color: C.muted }}>son sayfa</Text>
        </View>
        <Text style={{ flex: 1, fontFamily: F.hand, fontSize: 26, lineHeight: 26, color: C.orangeDeep, textAlign: 'right', marginBottom: 18 }}>{span} sayfa</Text>
      </View>

      <View accessibilityRole="adjustable" accessibilityLabel="Sayfa haritası" onLayout={e => setW(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onResponderGrant={touch} onResponderMove={touch}
        style={{ height: 44, justifyContent: 'center' }}>
        {d && (
          <Svg width={w} height={44}>
            <Path d={d.track} fill={C.paper2} transform="translate(0 11)" />
            <Path d={d.read} fill={C.sage} transform="translate(0 11)" />
            <Rect x={x(from)} y={5} width={Math.max(10, x(to + 1) - x(from))} height={34} rx={8} fill={C.orange} stroke={C.ink} strokeWidth={2} />
          </Svg>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ ...T.caption, color: C.muted }}>1</Text>
        <Text style={{ ...T.caption, color: C.muted }}>yeşil: okuduğun kadar · {pages}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PRESETS.filter(k => k <= Math.min(cap, pages)).map(k => <Chip key={k} label={`${k} sayfa`} on={span === k} onPress={() => setLen(k)} />)}
        <Chip label="kaldığım yer" on={from === resume} onPress={() => setStart(resume)} />
      </View>
    </View>
  );
}

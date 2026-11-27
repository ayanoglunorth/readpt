import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { TabEnter } from './BottomNav';
import { Icon, type IconName } from './Icon';
import { cutPath, Grain, Sticker } from './paper';
import { C, F, R, T } from './theme';

type Kind = 'primary' | 'accent' | 'outline' | 'soft' | 'ghost' | 'danger' | 'light' | 'lightGhost';
type BtnProps = { label: string; onPress: () => void; kind?: Kind; icon?: IconName; arrow?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> };

// fill / stroke / shadow are the three inks of a cut-paper button. `hand` kinds use the handwritten face.
const kinds: Record<Kind, { fill?: string; stroke?: string; shadow?: string; ink: string; arrow: string; hand?: boolean }> = {
  primary: { fill: C.ink, stroke: C.ink, shadow: C.orange, ink: C.cream, arrow: C.orange, hand: true },
  accent: { fill: C.orange, stroke: C.ink, shadow: C.ink, ink: C.ink, arrow: C.ink, hand: true },
  outline: { fill: C.card, stroke: C.ink, shadow: C.ink, ink: C.ink, arrow: C.orange },
  soft: { fill: C.card, stroke: C.ink, shadow: C.ink, ink: C.ink, arrow: C.orange },
  danger: { fill: C.card, stroke: C.danger, shadow: C.danger, ink: C.danger, arrow: C.danger },
  light: { fill: C.cream, stroke: C.cream, shadow: C.orange, ink: C.ink, arrow: C.orange, hand: true },
  ghost: { ink: C.muted, arrow: C.muted },
  lightGhost: { ink: 'rgba(253,246,230,0.72)', arrow: C.cream },
};

// A cut-paper button: hand-cut outline, a hard shadow in a second ink; pressing it sinks it into the page.
export function Btn({ label, onPress, kind = 'primary', icon, arrow, disabled, style }: BtnProps) {
  const k = kinds[kind];
  const text = k.hand ? { fontFamily: F.hand, fontSize: 26, lineHeight: 28, color: k.ink, letterSpacing: 0.3 } : { fontFamily: F.uiSemi, fontSize: 15, color: k.ink };
  const row = (
    <>
      {icon && <Icon name={icon} size={20} color={k.ink} />}
      <Text style={text}>{label}{' '}</Text>
      {arrow && <Icon name="arrowR" size={k.hand ? 22 : 18} bold color={k.arrow} />}
    </>
  );
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[{ opacity: disabled ? 0.4 : 1 }, style]}>
      {({ pressed }) => k.fill ? (
        <Sticker fill={k.fill} stroke={k.stroke} shadow={k.shadow} off={k.hand ? 5 : 4} r={R.btn} seed={label.length + 3} sunk={pressed} style={{ marginRight: 5, marginBottom: 5 }}
          contentStyle={[styles.btnRow, { minHeight: k.hand ? 58 : 52 }]}>{row}</Sticker>
      ) : <View style={[styles.btnRow, { minHeight: 48, opacity: pressed ? 0.6 : 1 }]}>{row}</View>}
    </Pressable>
  );
}

// Round icon control. `label` is the accessible name. 44 minimum touch size.
export function IconBtn({ icon, label, onPress, disabled, tone = 'soft', size = 44 }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; tone?: 'soft' | 'outline' | 'dark' | 'glass' | 'light'; size?: number }) {
  const t = {
    soft: { fill: C.card, stroke: C.ink, shadow: C.ink, ink: C.ink }, outline: { fill: C.card, stroke: C.ink, shadow: C.ink, ink: C.ink },
    dark: { fill: C.ink, stroke: C.ink, shadow: C.orange, ink: C.cream }, light: { fill: C.cream, stroke: C.cream, shadow: C.ink, ink: C.ink },
    glass: { fill: 'rgba(255,255,255,0.18)', stroke: undefined, shadow: undefined, ink: '#fff' },
  }[tone];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ opacity: disabled ? 0.35 : 1, marginRight: t.shadow ? 3 : 0, marginBottom: t.shadow ? 3 : 0 }}>
      {({ pressed }) => (
        <Sticker fill={t.fill} stroke={t.stroke} shadow={t.shadow} off={3} r={size / 2} seed={size} sw={1.8} sunk={pressed}
          contentStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={size > 44 ? 24 : 20} bold color={t.ink} />
        </Sticker>
      )}
    </Pressable>
  );
}

// Screen with the app's own header (round back button, serif title) in place of the system bar.
export function Screen({ children, title, right, back = true, scroll, bottom, tab, grain = true }: { children: ReactNode; title?: string; right?: ReactNode; back?: boolean; scroll?: boolean; bottom?: ReactNode; tab?: 'home' | 'words' | 'cekmece'; grain?: boolean }) {
  const insets = useSafeAreaInsets();
  const body = { padding: 20, gap: 16 } as const;
  const main = (
    <>
      {(title || back) && (
        <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
          {back ? <IconBtn icon="arrowL" label="Geri" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} /> : <View style={{ width: 44 }} />}
          <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, textAlign: 'center', ...T.heading, fontSize: 20 }}>{title}</Text>
          <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
        </View>
      )}
      {scroll ? <ScrollView style={{ flex: 1 }} contentContainerStyle={[body, { paddingBottom: bottom ? 24 : insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>{children}<Grain /></ScrollView>
        : <View style={[{ flex: 1 }, body, { paddingBottom: bottom ? 0 : insets.bottom + 8 }]}>{children}{grain && <Grain />}</View>}
    </>
  );
  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      {tab ? <TabEnter tab={tab}>{main}</TabEnter> : main}
      {bottom}
    </View>
  );
}

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.card, style]}>{children}</View>;
export const Heading = ({ children }: { children: string }) => <Text accessibilityRole="header" style={{ ...T.title, color: C.ink }}>{children}</Text>;

// Hand-drawn underline in orange, placed under the word it belongs to.
export const Squiggle = ({ w = 120, color = C.orange }: { w?: number; color?: string }) => (
  <Svg width={w} height={10} viewBox="0 0 120 10" preserveAspectRatio="none"><Path d="M2 6C20 1 34 9 52 5S86 2 118 6" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" /></Svg>
);

// A printed bar: hand-cut track with the filled part overprinted on it.
export function Progress({ value, color = C.orange, track = C.line }: { value: number; color?: string; track?: string }) {
  const [w, setW] = useState(0);
  const v = Math.max(0, Math.min(1, value));
  const d = useMemo(() => (w ? { t: cutPath(w, 12, 6, 11, 0.9), f: cutPath(Math.max(12, w * v), 12, 6, 12, 0.9) } : null), [w, v]);
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ height: 12 }}>
      {d && <Svg width={w} height={12}><Path d={d.t} fill={track} />{v > 0 && <Path d={d.f} fill={color} />}</Svg>}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 18, gap: 12 },
  h1: { color: C.ink, ...T.title },
  body: { color: C.ink, ...T.body },
  muted: { color: C.muted, ...T.body, fontSize: 14, lineHeight: 20 },
  btnRow: { paddingHorizontal: 22, paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
});

// Filter / option chip: a paper tab; the chosen one is printed solid ink with an orange shadow.
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress} style={{ marginRight: 3, marginBottom: 3 }}>
      {({ pressed }) => (
        <Sticker fill={on ? C.ink : C.paper2} stroke={on ? C.ink : undefined} shadow={on ? C.orange : undefined} off={3} r={19} seed={label.length} sw={1.5} sunk={pressed}
          contentStyle={{ paddingHorizontal: 16, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.uiSemi, fontSize: 13, color: on ? C.cream : C.ink }}>{label}</Text>
        </Sticker>
      )}
    </Pressable>
  );
}

// Mutually exclusive options in one rounded track; the active one is printed solid.
export function Segmented<V extends string | number>({ options, value, onChange, label }: { options: { value: V; label: string }[]; value: V | undefined; onChange: (v: V) => void; label: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', backgroundColor: C.paper2, borderRadius: 999, padding: 4 }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ borderRadius: 999, paddingHorizontal: 12, height: 38, minWidth: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.ink : 'transparent' }}>
            <Text style={{ fontFamily: F.uiSemi, fontSize: 13, color: on ? C.cream : C.ink }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A number you type: a cut-paper box with a big serif figure. Out-of-range input snaps back when you leave the field.
export function NumField({ value, onChange, min, max, label, w = 92 }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string; w?: number }) {
  const [text, setText] = useState(String(value));
  const [focus, setFocus] = useState(false);
  return (
    <Sticker fill={C.card} stroke={C.ink} shadow={C.ink} off={3} r={18} seed={w} sw={1.8} style={{ marginRight: 3, marginBottom: 3 }} contentStyle={{ width: w, height: 64, justifyContent: 'center' }}>
      <TextInput accessibilityLabel={label} value={focus ? text : String(value)} keyboardType="number-pad" selectTextOnFocus maxLength={4}
        onFocus={() => { setText(String(value)); setFocus(true); }}
        onChangeText={t => { const s = t.replace(/[^\d]/g, ''); setText(s); const n = Number(s); if (s && n >= min && n <= max) onChange(n); }}
        onBlur={() => { setFocus(false); const v = Math.min(max, Math.max(min, Number(text) || min)); setText(String(v)); onChange(v); }}
        style={{ textAlign: 'center', fontFamily: F.black, fontSize: 30, letterSpacing: -0.8, color: C.ink, padding: 0, height: 64 }} />
    </Sticker>
  );
}

// One answer row: a paper strip with a serif letter. `state` colours it after the answer is known.
export function Choice({ label, letter, state = 'idle', onPress, disabled }: { label: string; letter?: string; state?: 'idle' | 'right' | 'wrong' | 'dim'; onPress: () => void; disabled?: boolean }) {
  const fill = { idle: C.card, right: C.forest, wrong: C.danger, dim: C.paper2 }[state];
  const edge = { idle: C.ink, right: C.forest, wrong: C.danger, dim: undefined }[state];
  const colored = state === 'right' || state === 'wrong';
  const ink = colored ? C.cream : state === 'dim' ? C.muted : C.ink;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ marginRight: 4, marginBottom: 4 }}>
      {({ pressed }) => (
        <Sticker fill={fill} stroke={edge} shadow={state === 'idle' ? C.ink : undefined} off={4} r={18} seed={label.length + 5} sw={1.6} sunk={pressed}
          contentStyle={{ minHeight: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {letter && <Text style={{ width: 20, fontFamily: F.black, fontSize: 22, color: colored ? C.butter : C.orangeDeep }}>{letter}</Text>}
          <Text style={{ flex: 1, fontFamily: F.uiMed, fontSize: 16, lineHeight: 21, color: ink, paddingVertical: 10 }}>{label}</Text>
          {state === 'right' && <Icon name="check" bold size={20} color={C.cream} />}
          {state === 'wrong' && <Icon name="close" bold size={20} color={C.cream} />}
        </Sticker>
      )}
    </Pressable>
  );
}

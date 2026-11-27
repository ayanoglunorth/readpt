import { Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { C, F } from './theme';

// Every book gets a typographic cover drawn in code: one pigment, one hand-drawn motif, the title in serif. Stable per book id.
const TONES = [
  { bg: C.ink, ink: C.cream, accent: C.orange },
  { bg: C.orange, ink: C.ink, accent: C.cream },
  { bg: C.sage, ink: C.forestDeep, accent: C.forest },
  { bg: C.blush, ink: C.ink, accent: C.orangeDeep },
  { bg: C.forest, ink: C.cream, accent: C.butter },
  { bg: C.cream, ink: C.ink, accent: C.orange },
  { bg: C.butter, ink: C.ink, accent: C.forestDeep },
] as const;
const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const toneOf = (id: string) => TONES[hash(id) % TONES.length];

type P = { c: string };
const MOTIFS: ((p: P) => React.ReactNode)[] = [
  ({ c }) => (<><Circle cx={24} cy={24} r={8} fill={c} /><Path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4" stroke={c} strokeWidth={3} strokeLinecap="round" /></>),
  ({ c }) => <Path d="M31 6A18 18 0 1 0 42 31 14 14 0 0 1 31 6Z" fill={c} />,
  ({ c }) => (<><Path d="M24 26v18" stroke={c} strokeWidth={3} strokeLinecap="round" /><G fill={c}>{[0, 72, 144, 216, 288].map(a => <Circle key={a} cx={24 + 8 * Math.sin((a * Math.PI) / 180)} cy={18 - 8 * Math.cos((a * Math.PI) / 180)} r={5} />)}</G><Circle cx={24} cy={18} r={3.5} fill="#fff" fillOpacity={0.55} /></>),
  ({ c }) => <Path d="M3 40 18 14l8 13 6-8 13 21Z" fill={c} strokeLinejoin="round" />,
  ({ c }) => (<><Path d="M24 44V22" stroke={c} strokeWidth={3} strokeLinecap="round" /><Path d="M24 26C12 28 8 20 8 12c10 0 16 4 16 14ZM24 20c0-9 6-13 16-13 0 9-5 15-16 13Z" fill={c} /></>),
  ({ c }) => <Path d="M3 14q5-6 10 0t10 0 10 0 10 0M3 26q5-6 10 0t10 0 10 0 10 0M3 38q5-6 10 0t10 0 10 0 10 0" stroke={c} strokeWidth={3.2} strokeLinecap="round" fill="none" />,
  ({ c }) => <Path d="M24 3l4 17 17 4-17 4-4 17-4-17L3 24l17-4Z" fill={c} strokeLinejoin="round" />,
  ({ c }) => <Path d="M24 40C6 28 4 14 13 9c5-3 9 0 11 4 2-4 6-7 11-4 9 5 7 19-11 31Z" fill={c} />,
];

export const COVER_RATIO = 1.42;

// Cover of a book. `tilt` rotates it a few degrees like a book leaning on a shelf.
export function Cover({ id, title, w = 120, tilt = 0, lift }: { id: string; title: string; w?: number; tilt?: number; lift?: boolean }) {
  const t = toneOf(id);
  const h = Math.round(w * COVER_RATIO);
  const Motif = MOTIFS[(hash(id) >>> 3) % MOTIFS.length];
  const m = w * 0.26;
  return (
    <View accessible={false} style={[{ width: w, height: h, borderRadius: w * 0.05, backgroundColor: t.bg, overflow: 'hidden', transform: [{ rotate: `${tilt}deg` }] },
      lift && { shadowColor: '#3b2a10', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 8 }]}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w * 0.045, backgroundColor: 'rgba(0,0,0,0.16)' }} />
      <View style={{ flex: 1, padding: w * 0.12, paddingLeft: w * 0.16, justifyContent: 'space-between' }}>
        <Text numberOfLines={4} style={{ fontFamily: F.display, fontSize: w * 0.125, lineHeight: w * 0.135, letterSpacing: -w * 0.004, color: t.ink }}>{title}</Text>
        <Svg width={m} height={m} viewBox="0 0 48 48"><Motif c={t.accent} /></Svg>
      </View>
    </View>
  );
}

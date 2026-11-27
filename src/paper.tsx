import { useMemo, useState, type ReactNode } from 'react';
import { Image, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';

// The "print shop" language: every shape is cut by hand (jittered outline, same seed = same cut), printed in flat ink,
// and lifted off the paper by a hard offset shadow of a second ink. Nothing here is a CSS-looking rounded rectangle.

const rng = (seed: number) => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

/** Closed hand-cut outline of a rounded rectangle (r >= min/2 gives a circle). */
export function cutPath(w: number, h: number, r: number, seed = 1, amp = 1.2, ox = 0, oy = 0): string {
  r = Math.min(r, w / 2, h / 2);
  const rand = rng(seed);
  const pts: [number, number][] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26));
    for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  const arc = (cx: number, cy: number, a0: number) => {
    const n = Math.max(3, Math.ceil((r * Math.PI) / 2 / 9));
    for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  };
  arc(w - r, r, -Math.PI / 2); edge(w, r, w, h - r);
  arc(w - r, h - r, 0); edge(w - r, h, r, h);
  arc(r, h - r, Math.PI / 2); edge(0, h - r, 0, r);
  arc(r, r, Math.PI); edge(r, 0, w - r, 0);
  const q = pts.map(([x, y]) => [x + (rand() - 0.5) * 2 * amp + ox, y + (rand() - 0.5) * 2 * amp + oy] as const);
  const mid = (a: readonly [number, number], b: readonly [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(q[q.length - 1], q[0]);
  let d = `M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < q.length; i++) { const m = mid(q[i], q[(i + 1) % q.length]); d += `Q${q[i][0].toFixed(1)} ${q[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
  return d + 'Z';
}

/** Zigzag torn-paper edge along the top of a w x h strip (the paper is below the edge). */
export function tornPath(w: number, h: number, seed = 3, depth = 7): string {
  const rand = rng(seed);
  let d = `M0 ${h}L0 ${depth}`;
  for (let x = 0; x < w; x += 9) d += `L${Math.min(x + 9, w).toFixed(0)} ${(rand() * depth).toFixed(1)}`;
  return d + `L${w} ${h}Z`;
}

type StickerProps = {
  children?: ReactNode; fill: string; stroke?: string; shadow?: string; off?: number; r?: number; seed?: number; sw?: number;
  sunk?: boolean; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>;
};
/** A cut-paper shape under its children: ink outline, hard offset shadow. `sunk` presses it into the page (the shadow closes). */
export function Sticker({ children, fill, stroke, shadow, off = 4, r = 22, seed = 1, sw = 2, sunk, style, contentStyle }: StickerProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const o = shadow && !sunk ? off : 0;
  const d = useMemo(() => (box.w ? { face: cutPath(box.w - sw, box.h - sw, r, seed, 1.1, sw / 2, sw / 2), back: cutPath(box.w - sw, box.h - sw, r, seed + 7, 1.1, sw / 2, sw / 2) } : null), [box.w, box.h, r, seed, sw]);
  return (
    <View style={[{ transform: [{ translateX: sunk && shadow ? off : 0 }, { translateY: sunk && shadow ? off : 0 }] }, style]}>
      <View style={contentStyle} onLayout={e => { const { width, height } = e.nativeEvent.layout; if (width !== box.w || height !== box.h) setBox({ w: width, h: height }); }}>
        {d && (
          <Svg pointerEvents="none" width={box.w + off} height={box.h + off} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: -1 }}>
            {shadow && <Path d={d.back} fill={shadow} transform={`translate(${o} ${o})`} opacity={o ? 1 : 0} />}
            <Path d={d.face} fill={fill} stroke={stroke ?? 'none'} strokeWidth={stroke ? sw : 0} strokeLinejoin="round" />
          </Svg>
        )}
        {children}
      </View>
    </View>
  );
}

/** Paper fibre over its parent: the transparent 512px tile is laid out by hand (resizeMode "repeat" does not tile on web).
 *  Put it as the LAST child of a scroll view's content so the fibre moves with the page instead of staying nailed to the screen. */
export function Grain() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const cols = Math.ceil(box.w / 512);
  const tiles: number[] = Array.from({ length: cols * Math.ceil(box.h / 512) }, (_, i) => i);
  return (
    <View pointerEvents="none" onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', opacity: 0.55 }}>
      {tiles.map(i => <Image key={i} source={require('../assets/ui/grain.png')} style={{ position: 'absolute', width: 512, height: 512, left: (i % cols) * 512, top: Math.floor(i / cols) * 512 }} />)}
    </View>
  );
}

/** A word with a hand-swiped marker stroke behind it. Single line only. */
export function Marked({ children, style, color = C.orange }: { children: string; style: StyleProp<TextStyle>; color?: string }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const d = useMemo(() => (box.w ? cutPath(box.w + 14, box.h * 0.5, 8, 5, 2.2) : ''), [box.w, box.h]);
  return (
    <View style={{ alignSelf: 'flex-start' }}>
      {!!d && <Svg pointerEvents="none" width={box.w + 14} height={box.h * 0.5} style={{ position: 'absolute', left: -7, top: box.h * 0.4, transform: [{ rotate: '-1.4deg' }] }}><Path d={d} fill={color} /></Svg>}
      <Text onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} style={style}>{children}</Text>
    </View>
  );
}

/** Ruled-notebook page: faint horizontal rules every `gap` px are drawn by the rows themselves; this adds the red margin line. */
export const Margin = ({ left = 14 }: { left?: number }) => <View pointerEvents="none" style={{ position: 'absolute', left, top: 0, bottom: 0, width: 1.5, backgroundColor: C.orangeSoft }} />;

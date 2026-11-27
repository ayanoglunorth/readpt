// "Kağıt Rafı" design tokens: warm paper, near-black ink, one orange, a few book-cover pigments.
// Newsreader (serif) speaks, Instrument Sans (UI) labels, Caveat (hand) annotates. See docs/DESIGN.md.
export const C = {
  paper: '#f6eedd', paper2: '#eee3ca', card: '#fffaf0', ink: '#1c1b18', muted: '#6e6757', line: '#ddd0b4',
  orange: '#ee6a1f', orangeDeep: '#b9490d', orangeSoft: '#fbd9c1',
  forest: '#1f4a3d', forestDeep: '#16372d', sage: '#a9b79a', blush: '#f2b8c0', butter: '#f3c85a', cream: '#fdf6e6',
  danger: '#b3361a', ok: '#2e7a4f', white: '#ffffff',
};
// Three reading surfaces. `hi` is the spoken-word highlight, `cap` the drop cap colour.
export const READ_THEMES = [
  { name: 'Kağıt', bg: '#f6eedd', ink: '#1f1d19', mute: '#6e6757', hi: '#f6c98d', cap: '#ee6a1f', bar: '#1c1b18', barInk: '#fff' },
  { name: 'Sepya', bg: '#e6d3b0', ink: '#2c2013', mute: '#6b5638', hi: '#f0b565', cap: '#a8400c', bar: '#2c2013', barInk: '#fdf0d8' },
  { name: 'Gece', bg: '#171815', ink: '#e8e1d0', mute: '#9a9482', hi: '#6b4a1e', cap: '#f08a4b', bar: '#ee6a1f', barInk: '#1c1b18' },
] as const;
export const F = {
  serif: 'Newsreader_400Regular', serifIt: 'Newsreader_400Regular_Italic', serifMed: 'Newsreader_500Medium',
  display: 'Newsreader_700Bold', displayIt: 'Newsreader_700Bold_Italic', black: 'Newsreader_800ExtraBold',
  ui: 'InstrumentSans_400Regular', uiMed: 'InstrumentSans_500Medium', uiSemi: 'InstrumentSans_600SemiBold',
  hand: 'Caveat_700Bold',
} as const;
// Scale: display 40/42 (serif, tight), title 26/30, heading 18/24, body 16/24 (UI) · read 19+ (serif), label 14, caption 12.
export const T = {
  display: { fontSize: 44, lineHeight: 46, fontFamily: F.black, letterSpacing: -1.6 },
  title: { fontSize: 28, lineHeight: 31, fontFamily: F.display, letterSpacing: -0.8 },
  heading: { fontSize: 19, lineHeight: 24, fontFamily: F.display, letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 24, fontFamily: F.ui },
  label: { fontSize: 14, lineHeight: 18, fontFamily: F.uiMed },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: F.uiMed },
  hand: { fontSize: 22, lineHeight: 26, fontFamily: F.hand },
} as const;
export const R = { control: 14, tile: 16, card: 20, sheet: 28, btn: 28, pill: 999 } as const;
// Hard-edged paper shadow: soft, low, warm. Only for lifted covers and sheets.
export const LIFT = { shadowColor: '#3b2a10', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 6 } as const;
export const MAX_W = 560;

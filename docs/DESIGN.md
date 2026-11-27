# readpt design: "Kağıt Rafı" (paper shelf), printed

A bookshop tote bag, screen-printed: cream stock with fibre, black ink, one orange, a second hard-offset shadow ink under everything you can press.
Reference traits: cream page, heavy serif headlines, orange accent, full-width black buttons with handwritten labels, typographic book covers.

## The print-shop rules (`src/paper.tsx`)
- Nothing is a CSS rounded rectangle. Interactive shapes are cut by hand: `cutPath` jitters the outline (same seed = same cut), `Sticker` draws it under its children with an ink outline and a hard offset shadow in a second ink. Pressing sinks the shape into the page (the shadow closes).
- Containers that only hold things are not outlined: tinted fills, torn edges (`tornPath`), a plank under the books, a bookmark ribbon.
- `Marked` swipes an orange marker behind one headline word. Single line only.
- `Grain` (assets/ui/grain.png, made by `scripts/make-grain.py`) tiles a paper-fibre overlay over every screen.
- The words list is a ruled notebook: hairline rows, a margin line (`Margin`), translations in the hand.

## Tokens (`src/theme.ts`)
- Paper `#f6eedd`, card `#fffaf0`, ink `#1c1b18`, muted `#6e6757`, line `#ddd0b4`.
- One accent: orange `#ee6a1f` (text version `orangeDeep #b9490d` on paper). Cover pigments: forest, sage, blush, butter, ink, cream.
- Three reading surfaces (`READ_THEMES`): Kağıt, Sepya, Gece. Same index as saved `prefs.theme`.

## Type
- Newsreader (serif): display 800 for headlines and quiz words, 700 for titles, 400 for book text.
- Instrument Sans: labels, captions, UI body. Caveat 700: margin notes, labels on solid buttons, nav labels, translations. Never body text.
- No `fontWeight`: one font family per weight (RN).

## Components (`src/ui.tsx`)
- `Btn`: `primary` (ink, orange shadow, handwritten cream label), `accent` (orange, ink shadow), `outline`/`soft` (card, ink outline and shadow), `danger`, `light`, `ghost`. `IconBtn`: round cut-paper, bold glyph.
- `Chip`, `Segmented`, `Choice` (paper strip, serif letter), `Progress` (hand-cut printed bar), `Squiggle`.
- `NumField`: a number you type, in a cut-paper box. No +/- steppers, no bare sliders for counts.
- `RangePicker` (`src/RangePicker.tsx`): page range by typing two numbers, tapping length presets (3/5/10/20) or touching the page map (whole book as one strip; green = read so far, orange = chosen range).
- `BottomNav`: floating ink cut-paper bar with an orange shadow; the active tab sits on the logo's orange ball (pops in), handwritten labels, count stamp on Kelimeler. Tabs: raf, kelimeler, çekmece (settings drawer: level, reading look, voice, licences).
- `Cover` (`src/Cover.tsx`): typographic cover drawn in code, stable per book id.

## Rules
- No eyebrow label over a heading. Icons: Phosphor, regular at rest, fill for the active nav tab, bold inside controls.
- Book screen field colour is the cover's accent; the paper sheet meets it with a torn edge.
- Quiz and placement words sit on a tilted index card.

## Logo
- A serif "r" (cream) on ink, its ball terminal in orange. Master: `assets/logo.svg`; icons from `scripts/make-icons.py`.

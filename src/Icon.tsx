import type { ComponentType } from 'react';
import Svg, { Path } from 'react-native-svg';
import { BookmarkSimpleIcon } from 'phosphor-react-native/src/icons/BookmarkSimple';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { FilePlusIcon } from 'phosphor-react-native/src/icons/FilePlus';
import { GaugeIcon } from 'phosphor-react-native/src/icons/Gauge';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { NotebookIcon } from 'phosphor-react-native/src/icons/Notebook';
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { SpeakerHighIcon } from 'phosphor-react-native/src/icons/SpeakerHigh';
import { SunDimIcon } from 'phosphor-react-native/src/icons/SunDim';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { TextAlignJustifyIcon } from 'phosphor-react-native/src/icons/TextAlignJustify';
import { TextAlignLeftIcon } from 'phosphor-react-native/src/icons/TextAlignLeft';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowLeftIcon } from 'phosphor-react-native/src/icons/ArrowLeft';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { BookOpenTextIcon } from 'phosphor-react-native/src/icons/BookOpenText';
import { HeadphonesIcon } from 'phosphor-react-native/src/icons/Headphones';
import { TextAaIcon } from 'phosphor-react-native/src/icons/TextAa';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { ArchiveIcon } from 'phosphor-react-native/src/icons/Archive';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';

type Glyph = ComponentType<{ size?: number; color?: string; weight?: 'regular' | 'bold' | 'fill' }>;

// One icon family (Phosphor, imported per icon so the bundle stays small). `filled` is the solid state of the same glyph.
const SET = {
  chevL: CaretLeftIcon, chevR: CaretRightIcon, plus: PlusIcon, minus: MinusIcon, check: CheckIcon,
  play: PlayIcon, pause: PauseIcon, sound: SpeakerHighIcon, home: HouseIcon, bookmark: BookmarkSimpleIcon, notebook: NotebookIcon,
  gauge: GaugeIcon, filePlus: FilePlusIcon, sliders: SlidersHorizontalIcon, sun: SunIcon, sunLow: SunDimIcon,
  alignLeft: TextAlignLeftIcon, alignJustify: TextAlignJustifyIcon,
  arrowR: ArrowRightIcon, arrowL: ArrowLeftIcon, close: XIcon, read: BookOpenTextIcon, headphones: HeadphonesIcon, textSize: TextAaIcon,
  trash: TrashIcon, books: BooksIcon, drawer: ArchiveIcon, yes: CheckCircleIcon, no: XCircleIcon,
} satisfies Record<string, Glyph>;

const LINES = { leadTight: [8, 11, 14, 17], leadNormal: [6.5, 11, 15.5, 20], leadLoose: [5, 12, 19] } as const;

export type IconName = keyof typeof SET | keyof typeof LINES;

export function Icon({ name, size = 24, color = '#000', filled, bold }: { name: IconName; size?: number; color?: string; filled?: boolean; bold?: boolean }) {
  if (name in LINES) {
    const ys = LINES[name as keyof typeof LINES];
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={ys.map(y => `M5 ${y} H19`).join(' ')} stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      </Svg>
    );
  }
  const G: Glyph = SET[name as keyof typeof SET];
  const solid = filled || name === 'play' || name === 'pause';
  return <G size={size} color={color} weight={solid || name === 'yes' || name === 'no' ? 'fill' : bold ? 'bold' : 'regular'} />;
}

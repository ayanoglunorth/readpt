import { useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import { C } from './theme';

// Horizontal slider without a native module: ink track, filled part, round knob. Tap or drag.
export function Slider({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const [w, setW] = useState(1);
  const set = (e: GestureResponderEvent) => onChange(min + Math.max(0, Math.min(1, e.nativeEvent.locationX / w)) * (max - min));
  const p = (value - min) / (max - min);
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
      onLayout={e => setW(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onResponderGrant={set} onResponderMove={set}
      style={{ flex: 1, height: 44, justifyContent: 'center' }}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: C.line }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, width: p * w, height: 4, borderRadius: 2, backgroundColor: C.ink }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: p * (w - 24), width: 24, height: 24, borderRadius: 12, backgroundColor: C.orange, borderWidth: 3, borderColor: C.card }} />
    </View>
  );
}

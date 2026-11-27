import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { Sticker } from './paper';
import { C, F } from './theme';

type Tab = 'home' | 'words' | 'cekmece';
const TABS: { tab: Tab; label: string; icon: IconName; href: '/' | '/words' | '/cekmece' }[] = [
  { tab: 'home', label: 'raf', icon: 'books', href: '/' },
  { tab: 'words', label: 'kelimeler', icon: 'notebook', href: '/words' },
  { tab: 'cekmece', label: 'çekmece', icon: 'drawer', href: '/cekmece' },
];

// The bar is drawn by each tab screen, so only the content above it animates: it eases in from the side the tab sits on (like
// laying a sheet down), or rises a little on first open. The bar itself stays put.
let lastTab: Tab | null = null;
export function TabEnter({ tab, children }: { tab: Tab; children: ReactNode }) {
  const [t] = useState(() => new Animated.Value(0));
  const [dir] = useState(() => { const d = lastTab ? Math.sign(TABS.findIndex(x => x.tab === tab) - TABS.findIndex(x => x.tab === lastTab)) : 0; lastTab = tab; return d; });
  useEffect(() => { Animated.timing(t, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [t]);
  const from = (v: number) => t.interpolate({ inputRange: [0, 1], outputRange: [v, 0] });
  return <Animated.View style={{ flex: 1, opacity: t, transform: dir ? [{ translateX: from(28 * dir) }] : [{ translateY: from(14) }] }}>{children}</Animated.View>;
}

// A cut-paper bar floating above the bottom edge, printed ink with an orange shadow. The active tab sits on the logo's orange ball
// (it pops in when the screen opens); labels are handwritten. `due` is the review count stamped on Kelimeler.
export function BottomNav({ active, due = 0 }: { active: Tab; due?: number }) {
  const insets = useSafeAreaInsets();
  const [pop] = useState(() => new Animated.Value(0.4));
  useEffect(() => { Animated.spring(pop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start(); }, [pop, active]);
  return (
    <View style={{ backgroundColor: C.paper, paddingHorizontal: 22, paddingTop: 4, paddingBottom: Math.max(insets.bottom, 10) + 4 }}>
      <Sticker fill={C.ink} shadow={C.orange} off={5} r={36} seed={9} style={{ marginRight: 5, marginBottom: 5 }} contentStyle={{ flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 7 }}>
        {TABS.map(t => {
          const on = t.tab === active;
          return (
            <Pressable key={t.tab} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: on }} onPress={() => !on && router.navigate(t.href)}
              style={{ flex: 1, alignItems: 'center', gap: 0, paddingTop: 2 }}>
              <Animated.View style={{ transform: [{ scale: on ? pop : 1 }] }}>
                <Sticker fill={on ? C.orange : 'transparent'} r={24} seed={t.label.length} contentStyle={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon} size={26} color={on ? C.ink : 'rgba(253,246,230,0.66)'} filled={on} />
                </Sticker>
                {t.tab === 'words' && due > 0 && (
                  <View style={{ position: 'absolute', top: -3, right: -5, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, transform: [{ rotate: '8deg' }] }}>
                    <Text style={{ fontFamily: F.black, fontSize: 12, lineHeight: 15, color: C.ink }}>{due}</Text>
                  </View>
                )}
              </Animated.View>
              <Text style={{ fontFamily: F.hand, fontSize: 18, lineHeight: 20, color: on ? C.cream : 'rgba(253,246,230,0.62)' }}>{t.label}{'\u00A0'}</Text>
            </Pressable>
          );
        })}
      </Sticker>
    </View>
  );
}

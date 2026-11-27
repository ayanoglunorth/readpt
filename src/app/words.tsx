import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { DS } from '../../engine';
import { BottomNav } from '../BottomNav';
import { useFocusLoad } from '../hooks';
import { Icon } from '../Icon';
import { shareText } from '../share';
import { changeWords, getWords, type SavedWord } from '../store';
import { Grain, Marked, Margin } from '../paper';
import { C, F, T } from '../theme';
import { Btn, Screen, styles } from '../ui';

export default function Words() {
  const [loaded] = useFocusLoad(getWords, [] as SavedWord[], 'words');
  const [removed, setRemoved] = useState<string[]>([]);
  const words = loaded.filter(w => !removed.includes(w.word));
  const due = words.filter(w => (w.due ?? 0) <= Date.now()).length;

  const head = (
    <View style={{ gap: 14, paddingBottom: 10 }}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          <Text style={{ ...T.display, fontSize: 40, lineHeight: 42 }}>{words.length}</Text>
          <Marked style={{ ...T.display, fontSize: 40, lineHeight: 42 }}>kelime</Marked>
        </View>
        <Text style={{ ...T.hand, fontSize: 26, color: C.orangeDeep, marginTop: 8 }}>{due} tanesi tekrar bekliyor{'\u00A0'}</Text>
      </View>
      <Btn label="Pratik yap" arrow onPress={() => router.push('/practice')} disabled={words.length < 4} />
      {words.length > 0 && words.length < 4 && <Text style={styles.muted}>Pratik için en az 4 kelime gerek.</Text>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label="CSV" kind="outline" style={{ flex: 1, minHeight: 48 }} onPress={() => shareText('readpt-kelimeler.csv', DS.toCsv(words), 'text/csv')} disabled={!words.length} />
        <Btn label="Anki" kind="outline" style={{ flex: 1, minHeight: 48 }} onPress={() => shareText('readpt-kelimeler.txt', DS.toAnki(words), 'text/plain')} disabled={!words.length} />
      </View>
    </View>
  );

  return (
    <Screen title="Kelime defteri" back={false} tab="words" grain={false} bottom={<BottomNav active="words" due={due} />}>
      <View style={{ flex: 1 }}>
      <Margin left={-10} />
      <FlatList data={words} keyExtractor={w => w.word} ListHeaderComponent={head} renderScrollComponent={p => <ScrollView {...p}>{p.children}<Grain /></ScrollView>} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={{ ...styles.muted, paddingTop: 12 }}>Henüz kelime yok. Testte “Bilmiyorum” dediklerini ya da okurken dokunduklarını buraya kaydedebilirsin.</Text>}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.display, fontSize: 22, letterSpacing: -0.4, color: C.ink }}>{item.word}</Text>
              <Text style={{ fontFamily: F.hand, fontSize: 24, lineHeight: 26, color: C.orangeDeep }}>{item.translation || '—'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${item.word} sil`} hitSlop={6} onPress={async () => { setRemoved(r => [...r, item.word]); await changeWords(v => v.filter(x => x.word !== item.word)); }}
              style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.paper2 : 'transparent' })}>
              <Icon name="trash" size={22} color={C.muted} />
            </Pressable>
          </View>
        )} />
      </View>
    </Screen>
  );
}

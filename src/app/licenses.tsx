import { Text, View } from 'react-native';
import { C, T } from '../theme';
import { Screen, styles } from '../ui';

const ITEMS = [
  ['Kelime sıklığı', 'hermitdave/FrequencyWords (OpenSubtitles 2018 verisinden). Lisans: CC BY-SA 4.0. Bu uygulamadaki kelime sırası ondan türetilmiştir ve aynı lisansla paylaşılır.'],
  ['CEFR seviye listesi', 'CEFR-J Vocabulary Profile 1.5 (Tono Laboratuvarı, TUFS). Atıfla serbest kullanım.'],
  ['C1/C2 listesi', 'Octanove Vocabulary Profile. Lisans: CC BY-SA 4.0.'],
  ['Geçerli kelime listesi', 'ENABLE word list. Kamu malı.'],
  ['PDF okuma', 'pdf.js (Mozilla). Lisans: Apache-2.0.'],
  ['Kelime anlamı', 'Önce telefonun kendi çeviri motoru (Apple Translation / Google ML Kit) kullanılır. O çeviremezse yalnızca tek kelime Microsoft Translator (ücretsiz katman) üzerinden çevrilir. Kitap metni cihazdan çıkmaz.'],
];

export default function Licenses() {
  return (
    <Screen title="Lisanslar" scroll>
      {ITEMS.map(([t, b]) => (
        <View key={t} style={{ gap: 6, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line }}>
          <Text style={{ ...T.heading, fontSize: 20 }}>{t}</Text>
          <Text style={styles.muted}>{b}</Text>
        </View>
      ))}
    </Screen>
  );
}

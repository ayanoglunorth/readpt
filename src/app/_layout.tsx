import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans';
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium, Newsreader_700Bold, Newsreader_700Bold_Italic, Newsreader_800ExtraBold } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { C, MAX_W } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({ Caveat_700Bold, InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium, Newsreader_700Bold, Newsreader_700Bold_Italic, Newsreader_800ExtraBold });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_W, alignSelf: 'center' }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper }, animation: 'slide_from_right' }}>
        {/* Each tab screen draws its own BottomNav, so sliding between them would drag the bar along; swap instantly instead. */}
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="words" options={{ animation: 'none' }} />
        <Stack.Screen name="cekmece" options={{ animation: 'none' }} />
      </Stack>
      </View>
    </View>
  );
}

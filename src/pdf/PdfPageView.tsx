import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { pdfHtml } from './html';
import { RENDER_JS } from './renderScript';
import { C, T } from '../theme';

// One page of a stored PDF drawn exactly as printed, by pdf.js in a WebView. The page stays loaded; only the number changes.
// Words are not tappable here (the text view does that). Pinch to zoom is the WebView's own.
export default function PdfPageView({ uri, page, bg }: { uri: string; page: number; bg: string }) {
  const web = useRef<React.ComponentRef<typeof WebView>>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const html = useMemo(() => pdfHtml(`${RENDER_JS}\n__open(${JSON.stringify(uri)}, ${JSON.stringify(bg)});`), [uri, bg]);
  useEffect(() => { if (ready) web.current?.injectJavaScript(`window.__show(${page});true;`); }, [ready, page]);
  if (Platform.OS === 'web') return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Text style={{ ...T.body, color: C.muted, textAlign: 'center' }}>Sayfa görünümü yalnızca telefonda çalışır.</Text></View>;
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <WebView
        ref={web} source={{ html, baseUrl: 'file:///' }} originWhitelist={['*']}
        allowFileAccess allowFileAccessFromFileURLs allowUniversalAccessFromFileURLs allowingReadAccessToURL={uri} javaScriptEnabled
        style={{ flex: 1, backgroundColor: bg }} overScrollMode="never" showsVerticalScrollIndicator={false}
        onError={e => setErr(e.nativeEvent.description)}
        onMessage={e => {
          const m = JSON.parse(e.nativeEvent.data);
          if (m.type === 'opened') setReady(true);
          else if (m.type === 'error') setErr(m.message);
        }} />
      {!!err && <View style={{ position: 'absolute', left: 0, right: 0, top: 24, padding: 24 }}><Text style={{ ...T.body, color: C.danger, textAlign: 'center' }}>Sayfa gösterilemedi: {err}</Text></View>}
    </View>
  );
}

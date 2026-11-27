import { useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { pdfHtml } from './html';
import { CHUNK, type ExtractProps, type PdfMessage, type RawPage } from './types';

// Hidden WebView that runs pdf.js on a file:// PDF and reports its pages' text items.
// shortcut: file access flags are what let pdf.js fetch the file; not tried on a device here (see status.md spike list).
export default function PdfExtractor({ source, initial, startAt, onChunk, onProgress, onDone, onError }: ExtractProps) {
  const pages = useRef<RawPage[]>(initial ? [...initial] : []);
  const total = useRef(0);
  const html = useMemo(() => pdfHtml(`__run(${JSON.stringify({ url: source.uri })}, ${startAt ?? 1})`), [source.uri, startAt]);
  return (
    <WebView
      source={{ html, baseUrl: 'file:///' }}
      originWhitelist={['*']}
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      allowingReadAccessToURL={source.uri}
      javaScriptEnabled
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
      onError={e => onError(e.nativeEvent.description)}
      onMessage={e => {
        const m: PdfMessage = JSON.parse(e.nativeEvent.data);
        if (m.type === 'start') total.current = m.total;
        else if (m.type === 'page') { pages.current.push({ items: m.items }); onProgress(m.n, total.current); if (m.n % CHUNK === 0) onChunk?.(pages.current); }
        else if (m.type === 'done') onDone(pages.current);
        else if (m.type === 'error') onError(m.message);
      }}
    />
  );
}

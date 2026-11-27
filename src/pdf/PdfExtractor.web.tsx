import { createElement, useEffect, useMemo, useRef } from 'react';
import { pdfHtml } from './html';
import { CHUNK, type ExtractProps, type PdfMessage, type RawPage } from './types';

// Web preview twin of PdfExtractor: the same page runs in a hidden iframe and gets the PDF bytes by postMessage.
export default function PdfExtractor({ source, initial, startAt, onChunk, onProgress, onDone, onError }: ExtractProps) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const html = useMemo(() => pdfHtml(), []);
  const cb = useRef({ onProgress, onDone, onError, onChunk });
  cb.current = { onProgress, onDone, onError, onChunk };
  useEffect(() => {
    const pages: RawPage[] = initial ? [...initial] : [];
    let total = 0;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const m = e.data as PdfMessage;
      if (m.type === 'ready') frame.current!.contentWindow!.postMessage({ type: 'pdf', data: source.data, startAt }, '*');
      else if (m.type === 'start') total = m.total;
      else if (m.type === 'page') { pages.push({ items: m.items }); cb.current.onProgress(m.n, total); if (m.n % CHUNK === 0) cb.current.onChunk?.(pages); }
      else if (m.type === 'done') cb.current.onDone(pages);
      else if (m.type === 'error') cb.current.onError(m.message);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [source, initial, startAt]);
  return createElement('iframe', { ref: frame, srcDoc: html, style: { position: 'absolute', width: 1, height: 1, opacity: 0, border: 0 } });
}

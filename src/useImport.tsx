// Picking a PDF and turning it into book pages, for a new book or for the Turkish PDF of an existing one.
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { DS } from '../engine';
import { deleteDraft, loadDraft, pdfUri, readBytes, saveDraft, savePages, savePdf } from './bookFiles';
import PdfExtractor from './pdf/PdfExtractor';
import type { RawPage } from './pdf/types';
import { addBook, getBooks, setBookTr } from './store';

type Job = { id: string; title: string; uri: string; data?: ArrayBuffer; n: number; total: number; initial?: RawPage[]; trFor?: string };

/** `onFinished` runs after a Turkish PDF has been added (a new book opens its own screen instead). */
export function useImport(onFinished?: () => void) {
  const [job, setJob] = useState<Job | null>(null);
  const [msg, setMsg] = useState('');

  /** trFor: id of the English book this PDF is the Turkish edition of. */
  const pick = async (trFor?: string) => {
    setMsg('');
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    try {
      const bytes = await readBytes(a.uri);
      const id = trFor ? trFor + '-tr' : DS.bookId(bytes);
      if (!trFor && (await getBooks()).some(b => b.id === id)) {
        if (!pdfUri(id)) await savePdf(id, a.uri); // a book imported before PDFs were kept gets its page view this way
        return router.push(`/book/${id}`);
      }
      // An interrupted import of the same file continues after the last saved chunk.
      const initial = (await loadDraft(id)) ?? undefined;
      setJob({ id, title: a.name.replace(/\.pdf$/i, ''), uri: a.uri, data: bytes.buffer as ArrayBuffer, n: initial?.length ?? 0, total: 0, initial, trFor });
    } catch { setMsg('Dosya okunamadı.'); }
  };

  const onProgress = useCallback((n: number, total: number) => setJob(j => (j ? { ...j, n, total } : j)), []);
  const onError = useCallback((m: string) => { setJob(null); setMsg('PDF okunamadı: ' + m); }, []);
  const onChunk = useCallback((raw: RawPage[]) => { if (job) saveDraft(job.id, raw); }, [job]);
  const onDone = useCallback(async (raw: RawPage[]) => {
    const j = job;
    setJob(null);
    if (!j) return;
    const pages: string[][] = DS.buildPages(raw);
    const textPages = pages.filter(p => p.length).length;
    if (!textPages) return setMsg('Bu PDF’te seçilebilir metin yok (görsel tabanlı). Şimdilik yalnızca metin katmanı olan PDF’ler çalışıyor.');
    await savePages(j.id, pages);
    await savePdf(j.id, j.uri).catch(() => {}); // only the page view needs it
    await deleteDraft(j.id);
    if (j.trFor) { await setBookTr(j.trFor, { id: j.id, pages: pages.length, offset: 0 }); onFinished?.(); return; }
    await addBook({ id: j.id, title: j.title, pages: pages.length, textPages, at: Date.now() });
    if (textPages < pages.length * 0.1) setMsg('Uyarı: sayfaların çoğunda metin yok.');
    router.push(`/book/${j.id}`);
  }, [job, onFinished]);

  // Stable while the import runs, so the extractor does not restart on every progress update.
  const uri = job?.uri, data = job?.data;
  const source = useMemo(() => (uri ? { uri, data } : null), [uri, data]);
  const extractor = job && source ? (
    <PdfExtractor key={job.id} source={source} initial={job.initial} startAt={job.initial ? job.initial.length + 1 : 1}
      onChunk={onChunk} onProgress={onProgress} onDone={onDone} onError={onError} />
  ) : null;

  return { job, msg, pick, cancel: () => setJob(null), extractor };
}

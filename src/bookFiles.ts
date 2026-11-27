// Page text of a book: one JSON file per book in the app document folder (AsyncStorage rows are too small for a book).
import { Directory, File, Paths } from 'expo-file-system';

const dir = () => new Directory(Paths.document, 'books');
const file = (id: string) => new File(dir(), id + '.json');

export type Pages = string[][];

export async function savePages(id: string, pages: Pages) {
  if (!dir().exists) dir().create();
  const f = file(id);
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(pages));
}

export async function loadPages(id: string): Promise<Pages | null> {
  const f = file(id);
  return f.exists ? (JSON.parse(await f.text()) as Pages) : null;
}

export async function deletePages(id: string) {
  const f = file(id);
  if (f.exists) f.delete();
  const p = pdfFile(id);
  if (p.exists) p.delete();
}

// The PDF itself, kept so the reader can show a page exactly as printed (also the only readable view of a PDF whose text is garbled).
const pdfFile = (id: string) => new File(dir(), id + '.pdf');
export async function savePdf(id: string, uri: string) {
  if (!dir().exists) dir().create();
  const f = pdfFile(id);
  if (f.exists) f.delete();
  new File(uri).copy(f);
}
/** file:// uri of the stored PDF, or null for a book imported before PDFs were kept. */
export const pdfUri = (id: string): string | null => (pdfFile(id).exists ? pdfFile(id).uri : null);

// An unfinished import: the raw text items of the pages read so far (see PdfExtractor onChunk).
const draftFile = (id: string) => new File(dir(), id + '.draft.json');
export async function saveDraft(id: string, raw: unknown[]) {
  if (!dir().exists) dir().create();
  const f = draftFile(id);
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(raw));
}
export async function loadDraft(id: string): Promise<any[] | null> {
  const f = draftFile(id);
  try { return f.exists ? (JSON.parse(await f.text()) as any[]) : null; } catch { return null; }
}
export async function deleteDraft(id: string) {
  const f = draftFile(id);
  if (f.exists) f.delete();
}

/** Bytes of a picked file, for the book id. */
export const readBytes = async (uri: string) => new Uint8Array(await new File(uri).arrayBuffer());
